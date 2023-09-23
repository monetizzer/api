export interface AccountEntity {
  accountId: string;
  admin: boolean;
  email: string;
  discordId?: string;
  discord?: {
    username: string;
  };
  createdAt: Date;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface GetByAccountIdInput {
  accountId: string;
}

export interface GetByDiscordIdInput {
  discordId: string;
}

export interface CreateWithDiscordIdInput {
  accountId: string;
  banner: string;
  avatar: string;
  username: string;
  bio: string;
  discordId: string;
  discord: {
    username: string;
    visible: boolean;
  };
}

export interface AccountRepository {
  getByAccountId: (i: GetByAccountIdInput) => Promise<AccountEntity | void>;

  getByDiscordId: (i: GetByDiscordIdInput) => Promise<AccountEntity | void>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface AuthOutput {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface CreateFromDiscordOauthInput {
  code: string;
}

export interface AccountUseCase {
  createFromDiscordOauth: (
    i: CreateFromDiscordOauthInput,
  ) => Promise<AuthOutput>;
}
