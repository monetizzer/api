import { Paginated, PaginatedItems } from 'src/types/paginated-items';
import { OrderBy } from 'src/types/repository';

export interface StoreEntity {
	storeId: string;
	accountId: string;
	username: string;
	name: string;
	description: string;
	color?: string;
	bannerUrl?: string;
	avatarUrl?: string;
	createdAt: Date;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface GetByStoreIdInput {
	storeId: string;
}

export interface GetByAccountIdInput {
	accountId: string;
}

export interface GetByUsernameInput {
	username: string;
}

export interface CreateInput {
	accountId: string;
	username: string;
	name: string;
	description: string;
	color?: string;
	bannerUrl?: string;
	avatarUrl?: string;
}

export interface CreateOutput {
	storeId: string;
}

export interface UpdateInput {
	storeId: string;
	username?: string;
	name?: string;
	description?: string;
	color?: string;
	bannerUrl?: string;
	avatarUrl?: string;
}

export interface GetManyInput {
	storeId?: Array<string>;
	limit?: number;
	offset?: number;
	orderBy?: OrderBy<StoreEntity>;
}

export interface StoreRepository {
	getByStoreId: (i: GetByStoreIdInput) => Promise<StoreEntity | undefined>;

	getByAccountId: (i: GetByAccountIdInput) => Promise<StoreEntity | undefined>;

	getByUsername: (i: GetByUsernameInput) => Promise<StoreEntity | undefined>;

	getMany: (i: GetManyInput) => Promise<Array<StoreEntity>>;

	create: (i: CreateInput) => Promise<CreateOutput>;

	update: (i: UpdateInput) => Promise<void>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface CreateStoreInput {
	accountId: string;
	username: string;
	name: string;
	description: string;
	color?: string;
	banner?: Buffer;
	avatar?: Buffer;
}

export interface UpdateStoreInput {
	storeId?: string;
	accountId: string;
	username?: string;
	name?: string;
	description?: string;
	color?: string;
	banner?: Buffer;
	avatar?: Buffer;
}

export type GetNewInput = Paginated;

export type GetBestSellersInput = Paginated;

export interface StoreUseCase {
	create: (i: CreateStoreInput) => Promise<void>;

	update: (i: UpdateStoreInput) => Promise<void>;

	getNew: (i: GetNewInput) => Promise<PaginatedItems<StoreEntity>>;

	getBestSellers: (
		i: GetBestSellersInput,
	) => Promise<PaginatedItems<StoreEntity>>;
}
