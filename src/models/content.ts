import { MediaTypeEnum } from 'src/types/enums/media-type';
import { Paginated, PaginatedItems } from 'src/types/paginated-items';
import { Readable } from 'stream';

export interface ContentEntity {
	contentId: string;
	storeId: string;
	productId: string;
	type: MediaTypeEnum;
	mediaUrl: string;
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
	// We can't generate the contentId,
	// because the file in S3 must have the same ID,
	// and it's created before the record on the database
	contentId: string; // ^^^^^^^^^
	storeId: string;
	productId: string;
	type: MediaTypeEnum;
	mediaUrl: string;
}

export interface GetManyInput {
	productId: string;
	limit?: number;
	offset?: number;
}

export interface ContentRepository {
	create: (i: CreateInput) => Promise<void>;

	getMany: (i: GetManyInput) => Promise<Array<ContentEntity>>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface CreateContentInput {
	accountId: string;
	productId: string;
	type: MediaTypeEnum;
	media: Buffer;
	ext: string;
}

export interface CreateContentOutput {
	contentId: string;
	mediaUrl: string;
}

export interface GetInput {
	accountId: string;
	isAdmin: boolean;
	productId: string;
	contentId: string;
	ext: string;
}

export interface GetByProductInput extends Paginated {
	productId: string;
}

export interface ContentUseCase {
	create: (i: CreateContentInput) => Promise<CreateContentOutput>;

	get: (i: GetInput) => Promise<Readable>;

	getByProduct: (
		i: GetByProductInput,
	) => Promise<PaginatedItems<ContentEntity>>;
}
