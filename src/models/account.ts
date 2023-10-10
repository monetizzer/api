import { DocumentStatusEnum } from 'src/types/enums/document-status';
import { PlatformEnum } from 'src/types/enums/platform';

export interface AccountEntity {
	accountId: string;
	isAdmin?: boolean;
	email: string;
	username: string;
	notifyThrough: PlatformEnum;
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
			notifyThrough: PlatformEnum;
	  }
	| {
			email: string;
			notifyThrough: PlatformEnum;
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

export interface GetByDiscordIdInput {
	discordId: string;
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

	getByAccountId: (
		i: GetByAccountIdInput,
	) => Promise<AccountEntity | undefined>;

	getByUsername: (i: GetByUsernameInput) => Promise<AccountEntity | undefined>;

	getByEmail: (i: GetByEmailInput) => Promise<AccountEntity | undefined>;

	getByDiscordId: (
		i: GetByDiscordIdInput,
	) => Promise<AccountEntity | undefined>;

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

export interface CompleteAuthOutput {
	refreshToken: string;
	accessToken: string;
	expiresAt: string;
}

export interface AuthOutput {
	accessToken: string;
	expiresAt: string;
}

export interface CreateFromDiscordInput {
	code: string;
}

export interface SendMagicLinkInput {
	email: string;
}

export interface SendMagicLinkDiscordInput {
	discordId: string;
}

export interface SendMagicLinkDiscordOutput {
	code: string;
}

export interface ExchangeMagicLinkCodeInput {
	accountId: string;
	code: string;
}

export interface IamInput {
	accountId?: string;
	discordId?: string;
}

export interface AcceptInput {
	accountId: string;
	semVer: string;
}

export interface RefreshTokenInput {
	refreshToken: string;
}

export interface IamOutput {
	accountId: string;
	isAdmin: boolean;
	username: string;
	dvs: DocumentStatusEnum;
	discord?: {
		id: string;
		username: string;
	};
	store?: {
		id: string;
		color?: string;
	};
}

export interface AccountUseCase {
	createFromDiscordOauth: (
		i: CreateFromDiscordInput,
	) => Promise<CompleteAuthOutput>;

	sendMagicLink: (i: SendMagicLinkInput) => Promise<void>;

	sendMagicLinkDiscord: (
		i: SendMagicLinkDiscordInput,
	) => Promise<SendMagicLinkDiscordOutput>;

	exchangeMagicLinkCode: (
		i: ExchangeMagicLinkCodeInput,
	) => Promise<CompleteAuthOutput>;

	acceptTerms: (i: AcceptInput) => Promise<void>;

	refreshToken: (i: RefreshTokenInput) => Promise<AuthOutput>;

	iam: (i: IamInput) => Promise<IamOutput>;
}
