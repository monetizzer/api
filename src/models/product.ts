import { DeliveryMethodEnum } from 'src/types/enums/delivery-method';
import { MediaTypeEnum } from 'src/types/enums/media-type';
import { ProductStatusEnum } from 'src/types/enums/product-status';
import { ProductTypeEnum } from 'src/types/enums/product-type';
import { Paginated, PaginatedItems } from 'src/types/paginated-items';
import { OrderBy } from 'src/types/repository';

interface ProductHistoryItem {
	timestamp: Date;
	status: ProductStatusEnum;
	authorId: string | 'SYSTEM';
	message?: string;
	markedContentIds?: Array<string>;
}

export type ProductMediasCount = Partial<Record<MediaTypeEnum, number>>;

export interface ProductEntity {
	productId: string;
	storeId: string;
	type: ProductTypeEnum;
	status: ProductStatusEnum;
	history: Array<ProductHistoryItem>;
	name: string;
	description: string;
	color?: string;
	price: number; // Int, multiplied by 100 ($1 = 100, $0.30 = 30)
	previewImagesUrls: Array<string>;
	deliveryMethod: DeliveryMethodEnum;
	mediasCount?: ProductMediasCount;
	createdAt: Date;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface CreateInput {
	storeId: string;
	type: ProductTypeEnum;
	name: string;
	description: string;
	color?: string;
	price: number;
	previewImagesUrls: Array<string>;
	deliveryMethod: DeliveryMethodEnum;
}

export interface CreateOutput {
	productId: string;
}

export interface UpdateStatusInput {
	productId: string;
	status: ProductStatusEnum;
	message?: string;
	markedContentIds?: Array<string>;
	authorId?: string | 'SYSTEM';
}

export interface MarkAsReadyForReviewInput {
	productId: string;
	authorId: string;
	mediasCount: ProductMediasCount;
}

export interface GetByProductIdInput {
	productId: string;
}

export interface GetManyInput {
	productId?: Array<string>;
	storeId?: string;
	type?: ProductTypeEnum;
	status?: Array<ProductStatusEnum>;
	limit?: number;
	offset?: number;
	orderBy?: OrderBy<ProductEntity>;
}

export interface ProductRepository {
	create: (i: CreateInput) => Promise<CreateOutput>;

	updateStatus: (i: UpdateStatusInput) => Promise<void>;

	markAsReadyForReview: (i: MarkAsReadyForReviewInput) => Promise<void>;

	getByProductId: (
		i: GetByProductIdInput,
	) => Promise<ProductEntity | undefined>;

	getMany: (i: GetManyInput) => Promise<Array<ProductEntity>>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface CreateProductInput {
	storeId: string;
	type: ProductTypeEnum;
	name: string;
	description: string;
	color?: string;
	price: number;
	previewImages: Array<Buffer>;
}

export interface CreateProductOutput {
	productId: string;
}

export type GetNewInput = Paginated;

export type GetBestSellersInput = Paginated;

export interface MarkAsReadyInput {
	accountId: string;
	storeId?: string;
	productId: string;
}

export interface GetOneToReviewInput {
	productId: string;
}

export interface GetOneToReviewOutput {
	product: ProductEntity;
	contents: Array<{
		contentId: string;
		type: MediaTypeEnum;
		mediaUrl: string;
	}>;
}

export interface ReviewInput {
	productId: string;
	authorId: string | 'SYSTEM';
	approve: boolean;
	message?: string;
	markedContentIds?: Array<string>;
}

export interface GetApprovedStoreProductsInput extends Paginated {
	storeId: string;
	type?: ProductTypeEnum;
}

export interface GetStoreProductsInput extends Paginated {
	storeId?: string;
	status?: ProductStatusEnum;
	type?: ProductTypeEnum;
}

export interface GetProductInput {
	storeId?: string;
	productId: string;
}

export interface ProductUseCase {
	create: (i: CreateProductInput) => Promise<CreateProductOutput>;

	markAsReady: (i: MarkAsReadyInput) => Promise<void>;

	getNew: (i: GetNewInput) => Promise<PaginatedItems<ProductEntity>>;

	getBestSellers: (
		i: GetBestSellersInput,
	) => Promise<PaginatedItems<ProductEntity>>;

	getToReview: (i: Paginated) => Promise<PaginatedItems<ProductEntity>>;

	getOneToReview: (i: GetOneToReviewInput) => Promise<GetOneToReviewOutput>;

	review: (i: ReviewInput) => Promise<void>;

	getApprovedStoreProducts: (
		i: GetApprovedStoreProductsInput,
	) => Promise<PaginatedItems<ProductEntity>>;

	getStoreProducts: (
		i: GetStoreProductsInput,
	) => Promise<PaginatedItems<ProductEntity>>;

	getProduct: (i: GetProductInput) => Promise<ProductEntity>;
}
