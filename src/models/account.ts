export interface AccountEntity {
  accountId: string;
  admin: boolean;
  email: string;
  discordId?: string;
  discord?: {
    username: string;
    dmChannelId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
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

export type CreateInput =
  | {
      email: string;
    }
  | {
      email: string;
      discordId: string;
      discord: {
        username: string;
        dmChannelId: string;
        accessToken: string;
        refreshToken: string;
        expiresAt: string;
      };
    };

export type UpdateDiscordInput = {
  discordId: string;
  discord: {
    username: string;
    dmChannelId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
};

export interface GetByAccountIdInput {
  accountId: string;
}

export interface GetByEmailInput {
  email: string;
}

export interface GetByDiscordInput {
  discordId: string;
  email?: string;
}

export interface AccountRepository {
  create: (i: CreateInput) => Promise<AccountEntity>;

  updateDiscord: (i: UpdateDiscordInput) => Promise<AccountEntity>;

  getByAccountId: (i: GetByAccountIdInput) => Promise<AccountEntity | void>;

  getByEmail: (i: GetByEmailInput) => Promise<AccountEntity | void>;

  // Get by discord information (id or email)
  getByDiscord: (i: GetByDiscordInput) => Promise<AccountEntity | void>;
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

export interface CreateFromDiscordInput {
  code: string;
}

export interface CreateFromMagicLinkInput {
  accountId: string;
  code: string;
}

export interface IamInput {
  accountId: string;
}

export interface IamOutput {
  accountId: string;
  isAdmin: boolean;
  discord?: {
    id: string;
    username: string;
  };
}

export interface AccountUseCase {
  createFromDiscordOauth: (i: CreateFromDiscordInput) => Promise<AuthOutput>;

  createFromMagicLink: (i: CreateFromMagicLinkInput) => Promise<AuthOutput>;

  iam: (i: IamInput) => Promise<IamOutput>;
}
