import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GerencianetAdapter } from 'src/adapters/implementations/gerencianet.service';
import {
	CheckoutInput,
	CheckoutOutput,
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

	get: (i: GetInput) => Promise<SaleEntity>;

	@Cron(CronExpression.EVERY_30_MINUTES)
	async updateExpired(): Promise<void> {
		await this.saleRepository.updateExpired();
	}
}
