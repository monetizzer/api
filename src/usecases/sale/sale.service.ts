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
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { SaleRepositoryService } from 'src/repositories/mongodb/sale/sale-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { TransactionRepositoryService } from 'src/repositories/mongodb/transaction/transaction-repository.service';
import { ProductStatusEnum } from 'src/types/enums/product-status';
import { isPreMadeProduct } from 'src/types/enums/product-type';

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
		private readonly paymentAdapter: GerencianetAdapter,
	) {}

	async checkout({
		clientId,
		productId,
		paymentMethod,
	}: CheckoutInput): Promise<CheckoutOutput> {
		const product = await this.productRepository.get({
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

	processPixWebhook: (i: ProcessPixWebhookInput) => Promise<void>;

	async get({ isAdmin, accountId, saleId }: GetInput): Promise<GetOutput> {
		const sale = await this.saleRepository.getBySaleId({ saleId });

		await this.validateCanGetSale({
			isAdmin,
			accountId,
			sale,
		});

		const [product, store] = await Promise.all([
			this.productRepository.get({
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
