import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import {
	CreateProductInput,
	CreateProductOutput,
	MarkAsReadyInput,
	ProductUseCase,
} from 'src/models/product';
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { DeliveryMethodEnum } from 'src/types/enums/delivery-method';
import {
	ProductStatusEnum,
	canChangeStatus,
} from 'src/types/enums/product-status';
import {
	ProductTypeEnum,
	isPreMadeProduct,
} from 'src/types/enums/product-type';

@Injectable()
export class ProductService implements ProductUseCase {
	constructor(
		@Inject(ProductRepositoryService)
		private readonly productRepository: ProductRepositoryService,
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		private readonly fileAdapter: S3Adapter,
		private readonly idAdapter: UIDAdapter,
		private readonly discordAdapter: DiscordJSAdapter,
	) {}

	async create({
		storeId,
		accountId,
		previewImages,
		type,
		...i
	}: CreateProductInput): Promise<CreateProductOutput> {
		const store = await this.storeRepository.getByStoreId({ storeId });

		if (!store || store.accountId !== accountId) {
			throw new ForbiddenException('Cannot create products for this store');
		}

		const deliveryMethod = this.getDeliveryMethod(type);

		const previewImagesUrls = await Promise.all(
			previewImages.map((img) =>
				this.fileAdapter.save({
					folder: 'public',
					filePath: `/products/preview/${storeId}/${this.idAdapter.gen()}.jpeg`,
					file: img,
				}),
			),
		);

		const { productId } = await this.productRepository.create({
			...i,
			storeId,
			type,
			previewImagesUrls: previewImagesUrls.map(
				(url) => `${process.env['PUBLIC_FILES_URL']}${url}`,
			),
			deliveryMethod,
		});

		return {
			productId,
		};
	}

	async markAsReady({ accountId, productId }: MarkAsReadyInput): Promise<void> {
		const product = await this.productRepository.get({ productId });

		if (!product) {
			throw new NotFoundException('Product not found');
		}

		const store = await this.storeRepository.getByStoreId({
			storeId: product.storeId,
		});

		if (!store || store.accountId !== accountId) {
			throw new ForbiddenException('Cannot edit this product');
		}

		if (
			!canChangeStatus({
				oldStatus: product.status,
				newStatus: ProductStatusEnum.VALIDATING,
			})
		) {
			throw new ForbiddenException(
				`Products with status "${product.status}" cannot be marked as ready for review.`,
			);
		}

		await Promise.all([
			this.productRepository.updateStatus({
				productId,
				status: ProductStatusEnum.VALIDATING,
			}),
			this.discordAdapter.sendMessage({
				channelId: this.discordAdapter.channels.PRODUCTS,
				content: '@everyone',
				embeds: [
					{
						title: `Novo produto a ser revisado.`,
						fields: [
							{
								name: 'productId',
								value: productId,
								inline: true,
							},
						],
						timestamp: new Date(),
					},
				],
			}),
		]);
	}

	// Private

	private getDeliveryMethod(type: ProductTypeEnum): DeliveryMethodEnum {
		if (isPreMadeProduct(type)) {
			return DeliveryMethodEnum.AUTOMATIC_OUR_PLATFORM;
		}

		throw new BadRequestException('Unsupported product type');
	}
}
