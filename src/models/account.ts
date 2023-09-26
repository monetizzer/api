export interface AccountEntity {
  accountId: string;
  isAdmin?: boolean;
  email: string;
  username: string;
  discordId?: string;
  discord?: {
    username: string;
    dmChannelId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  lastTermsAccepted?: {
    semVer: string;
    acceptedAt: Date;
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
        expiresAt: Date;
      };
    };

export interface UpdateUsernameInput {
  accountId: string;
  username: string;
}

export type UpdateDiscordInput = {
  accountId: string;
  discordId: string;
  discord: {
    username: string;
    dmChannelId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
};

export type UpdateTermsInput = {
  accountId: string;
  lastTermsAccepted: {
    semVer: string;
  };
};

export interface GetByAccountIdInput {
  accountId: string;
}

export interface GetByUsernameInput {
  username: string;
}

export interface GetByEmailInput {
  email: string;
}

export interface GetManyByDiscordInput {
  discordId: string;
  email?: string;
}

export interface AccountRepository {
  create: (i: CreateInput) => Promise<AccountEntity>;

  updateUsername: (i: UpdateUsernameInput) => Promise<void>;

  updateDiscord: (i: UpdateDiscordInput) => Promise<void>;

  updateTerms: (i: UpdateTermsInput) => Promise<void>;

  getByAccountId: (i: GetByAccountIdInput) => Promise<AccountEntity | void>;

  getByUsername: (i: GetByUsernameInput) => Promise<AccountEntity | void>;

  getByEmail: (i: GetByEmailInput) => Promise<AccountEntity | void>;

  // Get by discord information (id or email)
  getManyByDiscord: (i: GetManyByDiscordInput) => Promise<Array<AccountEntity>>;
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
  // refreshToken: string; We will not use this for now
  // expiresAt: string;
}

export interface CreateFromDiscordInput {
  code: string;
}

export interface SendMagicLinkInput {
  email: string;
}

export interface CreateFromMagicLinkInput {
  accountId: string;
  code: string;
}

export interface IamInput {
  accountId: string;
}

export interface AcceptInput {
  accountId: string;
  semVer: string;
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

  sendMagicLink: (i: SendMagicLinkInput) => Promise<void>;

  createFromMagicLink: (i: CreateFromMagicLinkInput) => Promise<AuthOutput>;

  acceptTerms: (i: AcceptInput) => Promise<void>;

  iam: (i: IamInput) => Promise<IamOutput>;
}
