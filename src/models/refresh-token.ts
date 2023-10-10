export interface RefreshTokenEntity {
	refreshToken: string;
	accountId: string;
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
	accountId: string;
}

export interface CreateOutput {
	refreshToken: string;
}

export interface GetInput {
	refreshToken: string;
}

export interface DeleteInput {
	refreshToken: string;
}

export interface RefreshTokenRepository {
	create: (i: CreateInput) => Promise<CreateOutput>;

	get: (i: GetInput) => Promise<RefreshTokenEntity | undefined>;

	delete: (i: DeleteInput) => Promise<void>;
}
