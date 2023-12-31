import {
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GerencianetAdapter } from 'src/adapters/implementations/gerencianet.service';
import {
	CheckoutInput,
	CheckoutOutput,
	GetOutput,
	GetInput,
	ProcessPixWebhookInput,
	SaleEntity,
	SaleUseCase,
	ClientSalesInput,
	StoreSalesInput,
} from 'src/models/sale';
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { SaleRepositoryService } from 'src/repositories/mongodb/sale/sale-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { ProductStatusEnum } from 'src/types/enums/product-status';
import { isPreMadeProduct } from 'src/types/enums/product-type';
import { SalesStatusEnum } from 'src/types/enums/sale-status';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { NotificationService } from '../notification/notification.service';
import { PaginatedItems } from 'src/types/paginated-items';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { IncomeRepositoryService } from 'src/repositories/mongodb/transaction/income-repository.service';
import { PaymentProviderEnum } from 'src/types/enums/payment-provider';
import { TransactionIncomeEntity } from 'src/models/transaction';
import { DateAdapter } from 'src/adapters/implementations/date.service';

interface ValidateCanGetSaleInput {
	accountId: string;
	isAdmin: boolean;
	sale: SaleEntity;
}

@Injectable()
export class SaleService implements SaleUseCase {
	private readonly saleExpirationInMinutes = 60; // 1h

	constructor(
		@Inject(SaleRepositoryService)
		private readonly saleRepository: SaleRepositoryService,
		@Inject(IncomeRepositoryService)
		private readonly transactionRepository: IncomeRepositoryService,
		@Inject(ProductRepositoryService)
		private readonly productRepository: ProductRepositoryService,
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		private readonly notificationUsecase: NotificationService,
		private readonly paymentAdapter: GerencianetAdapter,
		private readonly utilsAdapter: UtilsAdapter,
		private readonly dateAdapter: DateAdapter,
	) {}

	async checkout({
		clientId,
		storeId,
		productId,
		paymentMethod,
	}: CheckoutInput): Promise<CheckoutOutput> {
		const product = await this.productRepository.getByProductId({
			productId,
		});

		if (!product || product.status !== ProductStatusEnum.APPROVED) {
			throw new NotFoundException('Product not found');
		}

		if (product.storeId === storeId) {
			throw new ForbiddenException('Cannot purchase your own product');
		}

		if (isPreMadeProduct(product.type)) {
			const hasBoughtPreMadeProduct =
				await this.saleRepository.hasBoughtPreMadeProduct({
					clientId,
					productId,
				});

			if (hasBoughtPreMadeProduct) {
				throw new ConflictException('Already purchased this product');
			}
		}

		const [{ saleId }, { accountId: storeAccountId }] = await Promise.all([
			this.saleRepository.create({
				clientId,
				productId,
				storeId: product.storeId,
				value: product.price,
				paymentMethod,
			}),
			this.storeRepository.getByStoreId({
				storeId: product.storeId,
			}),
		]);

		const pix = await this.paymentAdapter.genPix({
			saleId,
			value: product.price,
			expirationInMinutes: this.saleExpirationInMinutes,
		});

		await this.transactionRepository.create({
			saleId,
			accountId: storeAccountId,
			amount: product.price,
			paymentMethod,
			provider: PaymentProviderEnum.GERENCIANET,
			pixCode: pix.code,
			pixExpiresAt: this.dateAdapter.nowPlus(
				this.saleExpirationInMinutes,
				'minutes',
			),
		});

		return {
			pix,
		};
	}

	async processPixWebhook({
		saleId,
		paymentId,
		amount,
	}: ProcessPixWebhookInput): Promise<void> {
		const transactions = await this.transactionRepository.getManyBySaleId({
			saleId,
		});

		if (transactions.length <= 0) {
			await this.paymentAdapter.refund({ saleId });

			return;
		}

		if (
			transactions.length === 1 &&
			transactions[0].status === TransactionStatusEnum.FAILED
		) {
			await this.paymentAdapter.refund({ saleId });

			return;
		}

		const completedTransactions: Array<TransactionIncomeEntity> = [];
		const processingTransactions: Array<TransactionIncomeEntity> = [];
		const failedTransactions: Array<TransactionIncomeEntity> = [];

		for (const transaction of transactions) {
			if (transaction.status === TransactionStatusEnum.COMPLETED) {
				completedTransactions.push(transaction);
			}
			if (transaction.status === TransactionStatusEnum.PROCESSING) {
				processingTransactions.push(transaction);
			}
			if (transaction.status === TransactionStatusEnum.FAILED) {
				failedTransactions.push(transaction);
			}
		}

		if (completedTransactions.length > 0) {
			const completedWithSamePaymentId = completedTransactions.find(
				(t) => t.paymentId === paymentId,
			);

			if (!completedWithSamePaymentId) {
				await this.paymentAdapter.refund({ saleId });

				return;
			}

			return;
		}

		const processingWithSameAmount = processingTransactions.find(
			(t) => t.amount === amount,
		);

		if (!processingWithSameAmount) {
			await this.paymentAdapter.refund({ saleId });

			return;
		}

		const sale = await this.saleRepository.getBySaleId({
			saleId,
		});

		if (!sale) {
			await this.paymentAdapter.refund({ saleId });

			return;
		}

		await Promise.all([
			this.transactionRepository.complete({
				transactionId: processingWithSameAmount.transactionId,
				status: TransactionStatusEnum.COMPLETED,
				paymentId,
				setSaleAsDelivered: true, // TODO Temporary, only for pre made products!
			}),
			// TODO Temporary, only for pre made products!
			this.saleRepository.completePreMade({
				saleId,
			}),
			this.notificationUsecase.sendNotification({
				accountId: sale.clientId,
				// templateId: 'SALE_PAID',
				templateId: 'SALE_DELIVERED', // TODO Temporary, only for pre made products!
				data: {
					saleId,
					productId: sale.productId,
				},
			}),
		]);
	}

	async get({ isAdmin, accountId, saleId }: GetInput): Promise<GetOutput> {
		const sale = await this.saleRepository.getBySaleId({ saleId });

		await this.validateCanGetSale({
			isAdmin,
			accountId,
			sale,
		});

		const [product, store, transactions] = await Promise.all([
			this.productRepository.getByProductId({
				productId: sale.productId,
			}),
			this.storeRepository.getByStoreId({
				storeId: sale.storeId,
			}),
			this.transactionRepository.getManyBySaleId({
				saleId,
			}),
		]);

		return {
			...sale,
			product,
			store,
			transaction: transactions[0]!,
		};
	}

	async clientSales({
		accountId,
		storeId,
		status,
		page,
		limit: originalLimit,
	}: ClientSalesInput): Promise<PaginatedItems<SaleEntity>> {
		const { offset, limit, paging } = this.utilsAdapter.pagination({
			page,
			limit: originalLimit,
		});

		const sales = await this.saleRepository.getMany({
			clientId: accountId,
			storeId,
			status: status ? [status] : undefined,
			offset,
			limit,
		});

		return {
			paging,
			data: sales,
		};
	}

	async storeSales({
		storeId,
		clientId,
		productId,
		status,
		page,
		limit: originalLimit,
	}: StoreSalesInput): Promise<PaginatedItems<SaleEntity>> {
		if (!storeId) {
			throw new NotFoundException('Store not found');
		}

		const { offset, limit, paging } = this.utilsAdapter.pagination({
			page,
			limit: originalLimit,
		});

		const sales = await this.saleRepository.getMany({
			storeId,
			clientId,
			productId,
			status: status
				? [status]
				: [
						SalesStatusEnum.PAID,
						SalesStatusEnum.DELIVERED,
						SalesStatusEnum.CONFIRMED_DELIVERY,
						SalesStatusEnum.IN_DISPUTE,
						SalesStatusEnum.REFUNDED,
				  ],
			offset,
			limit,
		});

		return {
			paging,
			data: sales,
		};
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async updateExpired(): Promise<void> {
		await Promise.all([
			this.saleRepository.updateExpired({
				expirationInMinutes: this.saleExpirationInMinutes,
			}),
			this.transactionRepository.updateExpired({
				expirationInMinutes: this.saleExpirationInMinutes,
			}),
		]);
	}

	// Private

	async validateCanGetSale({
		isAdmin,
		accountId,
		sale,
	}: ValidateCanGetSaleInput) {
		if (isAdmin) return;

		if (accountId === sale.clientId) return;

		const store = await this.storeRepository.getByAccountId({ accountId });

		if (store?.storeId === sale.storeId) return;

		throw new ForbiddenException('Cannot access sale');
	}
}
