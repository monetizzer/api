import { DeliveryMethodEnum } from 'src/types/enums/delivery-method';
import { MediaTypeEnum } from 'src/types/enums/media-type';
import { ProductStatusEnum } from 'src/types/enums/product-status';
import { ProductTypeEnum } from 'src/types/enums/product-type';

interface ProductHistoryItem {
	timestamp: Date;
	status: ProductStatusEnum;
	message?: string;
	markedContentIds?: Array<string>;
	reviewerId?: string;
}

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
	reviewerId?: string;
}

export interface GetByProductIdInput {
	productId: string;
}

export interface GetManyInput {
	storeId?: string;
	status?: Array<ProductStatusEnum>;
}

export interface ProductRepository {
	create: (i: CreateInput) => Promise<CreateOutput>;

	updateStatus: (i: UpdateStatusInput) => Promise<void>;

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
	accountId: string;
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

export interface MarkAsReadyInput {
	accountId: string;
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
	reviewerId: string;
	approve: boolean;
	message?: string;
	markedContentIds?: Array<string>;
}

export interface ProductUseCase {
	create: (i: CreateProductInput) => Promise<CreateProductOutput>;

	markAsReady: (i: MarkAsReadyInput) => Promise<void>;

	getToReview: () => Promise<Array<ProductEntity>>;

	getOneToReview: (i: GetOneToReviewInput) => Promise<GetOneToReviewOutput>;

	review: (i: ReviewInput) => Promise<void>;
}
