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
	GetOneToReviewInput,
	GetOneToReviewOutput,
	GetStoreProductsInput,
	MarkAsReadyInput,
	ProductEntity,
	ProductUseCase,
	ReviewInput,
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
import { NotificationService } from '../notification/notification.service';
import { ContentRepositoryService } from 'src/repositories/mongodb/content/content-repository.service';
import { Paginated, PaginatedItems } from 'src/types/paginated-items';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Injectable()
export class ProductService implements ProductUseCase {
	constructor(
		@Inject(ProductRepositoryService)
		private readonly productRepository: ProductRepositoryService,
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		@Inject(ContentRepositoryService)
		private readonly contentRepository: ContentRepositoryService,
		@Inject(NotificationService)
		private readonly notificationUsecase: NotificationService,
		private readonly fileAdapter: S3Adapter,
		private readonly idAdapter: UIDAdapter,
		private readonly discordAdapter: DiscordJSAdapter,
		private readonly utilsAdapter: UtilsAdapter,
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
					folder: process.env['PUBLIC_BUCKET_NAME'],
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
		const product = await this.productRepository.getByProductId({ productId });

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

	async review({
		productId,
		approve,
		message,
		reviewerId,
		markedContentIds,
	}: ReviewInput): Promise<void> {
		if (!approve && !message) {
			throw new BadRequestException(
				'Message is required if document is rejected',
			);
		}

		const product = await this.productRepository.getByProductId({
			productId,
		});

		const status = approve
			? ProductStatusEnum.APPROVED
			: ProductStatusEnum.REPROVED;

		if (
			!canChangeStatus({
				oldStatus: product.status,
				newStatus: status,
			})
		) {
			throw new BadRequestException(
				`Can't change status from "${product.status}" to "${status}"`,
			);
		}

		const [store] = await Promise.all([
			this.storeRepository.getByStoreId({
				storeId: product.storeId,
			}),
			this.productRepository.updateStatus({
				productId,
				status,
				reviewerId,
				message,
				markedContentIds,
			}),
		]);

		if (!store) return;

		await Promise.all([
			this.discordAdapter.sendMessage({
				channelId: this.discordAdapter.channels.PRODUCTS,
				content: '@everyone',
				embeds: [
					{
						title: `Novo produto ${approve ? 'aprovado' : 'reprovado'}.`,
						fields: [
							{
								name: 'ProductId',
								value: productId,
								inline: true,
							},
							{
								name: 'ReviewerId',
								value: reviewerId,
								inline: true,
							},
						],
						color: approve ? '#e81212' : '#12e820',
						timestamp: new Date(),
					},
				],
			}),
			this.notificationUsecase.sendNotification({
				accountId: store.accountId,
				templateId: approve ? 'PRODUCT_APPROVED' : 'PRODUCT_REPROVED',
			}),
		]);
	}

	async getToReview(i: Paginated): Promise<PaginatedItems<ProductEntity>> {
		const { offset, limit, paging } = this.utilsAdapter.pagination(i);

		const products = await this.productRepository.getMany({
			status: [ProductStatusEnum.VALIDATING],
			limit,
			offset,
		});

		return {
			paging,
			data: products,
		};
	}

	async getOneToReview({
		productId,
	}: GetOneToReviewInput): Promise<GetOneToReviewOutput> {
		const [product, contents] = await Promise.all([
			this.productRepository.getByProductId({
				productId,
			}),
			this.contentRepository.getMany({
				productId,
			}),
		]);

		return {
			product,
			contents: contents.map((c) => ({
				contentId: c.contentId,
				type: c.type,
				mediaUrl: c.mediaUrl,
			})),
		};
	}

	async getStoreProducts({
		storeId,
		type,
		page,
		limit: originalLimit,
	}: GetStoreProductsInput): Promise<PaginatedItems<ProductEntity>> {
		const { offset, limit, paging } = this.utilsAdapter.pagination({
			page,
			limit: originalLimit,
		});

		const products = await this.productRepository.getMany({
			storeId,
			type,
			status: [ProductStatusEnum.APPROVED],
			limit,
			offset,
		});

		return {
			paging,
			data: products,
		};
	}

	// Private

	private getDeliveryMethod(type: ProductTypeEnum): DeliveryMethodEnum {
		if (isPreMadeProduct(type)) {
			return DeliveryMethodEnum.AUTOMATIC_OUR_PLATFORM;
		}

		throw new BadRequestException('Unsupported product type');
	}
}
