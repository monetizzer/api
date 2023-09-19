import type { DocumentValidationStatusEnum } from '../../types/enums/document-validation-status.js';

export interface AccountEntity {
  accountId: string;
  admin: boolean;
  dvs: DocumentValidationStatusEnum;
  email: string;
  discordId?: string;
  discord?: {
    username: string;
    visible: boolean;
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

export interface UnlinkThirdPartyRepoInput {
  accountId: string;
  platform: PlatformEnum;
  notifyThrough: NotifyThroughEnum;
}

export interface DeleteInput {
  accountId: string;
}

export interface GetByUsernameInput {
  username: string;
}

export interface UpdateUsernameRepoInput {
  accountId: string;
  newUsername: string;
}

export interface AccountRepository {
  getByAccountId: (i: GetByAccountIdInput) => Promise<AccountEntity | void>;

  getByDiscordId: (i: GetByDiscordIdInput) => Promise<AccountEntity | void>;

  getByUsername: (i: GetByUsernameInput) => Promise<AccountEntity | void>;

  updateUsername: (i: UpdateUsernameRepoInput) => Promise<AccountEntity | void>;

  createWithDiscordId: (i: CreateWithDiscordIdInput) => Promise<AccountEntity>;

  unlinkThirdParty: (i: UnlinkThirdPartyRepoInput) => Promise<void>;

  delete: (i: DeleteInput) => Promise<void>;
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
