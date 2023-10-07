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
} from 'src/models/sale';
import { TransactionEntity } from 'src/models/transaction';
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { SaleRepositoryService } from 'src/repositories/mongodb/sale/sale-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { TransactionRepositoryService } from 'src/repositories/mongodb/transaction/transaction-repository.service';
import { ProductStatusEnum } from 'src/types/enums/product-status';
import { isPreMadeProduct } from 'src/types/enums/product-type';
import { SalesStatusEnum } from 'src/types/enums/sale-status';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { NotificationService } from '../notification/notification.service';

interface ValidateCanGetSaleInput {
	accountId: string;
	isAdmin: boolean;
	sale: SaleEntity;
}

@Injectable()
export class SaleService implements SaleUseCase {
	constructor(
		@Inject(SaleRepositoryService)
		private readonly saleRepository: SaleRepositoryService,
		@Inject(TransactionRepositoryService)
		private readonly transactionRepository: TransactionRepositoryService,
		@Inject(ProductRepositoryService)
		private readonly productRepository: ProductRepositoryService,
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		private readonly notificationUsecase: NotificationService,
		private readonly paymentAdapter: GerencianetAdapter,
	) {}

	async checkout({
		clientId,
		productId,
		paymentMethod,
	}: CheckoutInput): Promise<CheckoutOutput> {
		const product = await this.productRepository.getByProductId({
			productId,
		});

		if (!product || product.status !== ProductStatusEnum.APPROVED) {
			throw new NotFoundException('Product not found');
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

		const [pix] = await Promise.all([
			this.paymentAdapter.genPix({
				saleId,
				value: product.price,
			}),
			this.transactionRepository.createIncome({
				saleId,
				accountId: storeAccountId,
				amount: product.price,
			}),
		]);

		return {
			pix,
		};
	}

	async processPixWebhook({
		saleId,
		paymentId,
		amount,
	}: ProcessPixWebhookInput): Promise<void> {
		const transactions = await this.transactionRepository.getMany({ saleId });

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

		const completedTransactions: Array<TransactionEntity> = [];
		const processingTransactions: Array<TransactionEntity> = [];
		const failedTransactions: Array<TransactionEntity> = [];

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
			this.transactionRepository.completeIncome({
				transactionId: processingWithSameAmount.transactionId,
				status: TransactionStatusEnum.COMPLETED,
				paymentId,
			}),
			this.saleRepository.updateStatus({
				saleId,
				status: SalesStatusEnum.PAID,
			}),
			this.notificationUsecase.sendNotification({
				accountId: sale.clientId,
				title: 'Pagamento confirmado!',
				description: `Pagamento do pedido __#${saleId}__ confirmado! Você já pode acessar os conteúdos.`,
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

		const [product, store] = await Promise.all([
			this.productRepository.getByProductId({
				productId: sale.productId,
			}),
			this.storeRepository.getByStoreId({
				storeId: sale.storeId,
			}),
		]);

		return {
			...sale,
			product,
			store,
		};
	}

	@Cron(CronExpression.EVERY_30_MINUTES)
	async updateExpired(): Promise<void> {
		await this.saleRepository.updateExpired();
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
