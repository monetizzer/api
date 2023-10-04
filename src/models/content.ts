import { MediaTypeEnum } from 'src/types/enums/media-type';
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
	storeId: string;
	productId: string;
	type: MediaTypeEnum;
	mediaUrl: string;
}

export interface GetManyInput {
	productId: string;
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
	productId: string;
	type: MediaTypeEnum;
	media: Buffer;
}

export interface GetAdminInput {
	contentId: string;
}

export interface ContentUseCase {
	create: (i: CreateContentInput) => Promise<void>;

	getAdmin: (i: CreateContentInput) => Promise<Readable>;
}
