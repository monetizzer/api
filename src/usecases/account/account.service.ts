import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
	AcceptInput,
	AccountEntity,
	AccountUseCase,
	AuthOutput,
	CreateFromDiscordInput,
	CreateFromMagicLinkInput,
	IamInput,
	IamOutput,
	SendMagicLinkInput,
} from 'src/models/account';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { JWTAdapter } from 'src/adapters/implementations/jwt.service';
import { MagicLinkCodeRepositoryService } from 'src/repositories/mongodb/magic-lick-codes/magic-link-code-repository.service';
import { TermsRepositoryService } from 'src/repositories/mongodb/terms/terms-repository.service';
import { SemVerAdapter } from 'src/adapters/implementations/semver.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { PlatformEnum } from 'src/types/enums/platform';
import { DocumentRepositoryService } from 'src/repositories/mongodb/document/document-repository.service';
import { DocumentStatusEnum } from 'src/types/enums/document-status';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AccountService implements AccountUseCase {
	private readonly requiredDiscordScopes = [
		'identify',
		'email',
		'guilds',
		'guilds.join',
		'guilds.members.read',
	];

	constructor(
		@Inject(AccountRepositoryService)
		private readonly accountRepository: AccountRepositoryService,
		@Inject(MagicLinkCodeRepositoryService)
		private readonly magicLinkCodeRepository: MagicLinkCodeRepositoryService,
		@Inject(TermsRepositoryService)
		private readonly termsRepository: TermsRepositoryService,
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		@Inject(DocumentRepositoryService)
		private readonly documentRepository: DocumentRepositoryService,
		@Inject(NotificationService)
		private readonly notificationUsecase: NotificationService,
		private readonly discordAdapter: DiscordJSAdapter,
		private readonly tokenAdapter: JWTAdapter,
		private readonly versionAdapter: SemVerAdapter,
	) {}

	async createFromDiscordOauth({
		code,
	}: CreateFromDiscordInput): Promise<AuthOutput> {
		const { scopes, ...discordTokens } = await this.discordAdapter
			.exchangeCode(code)
			.catch(() => {
				throw new HttpException('Invalid code', HttpStatus.BAD_REQUEST);
			});

		const missingScopes = this.requiredDiscordScopes.filter(
			(s) => !scopes.includes(s),
		);

		if (missingScopes.length > 0) {
			throw new HttpException(
				`Missing required scopes: ${missingScopes.join(' ')}`,
				HttpStatus.BAD_REQUEST,
			);
		}

		const discordData = await this.discordAdapter.getAuthenticatedUserData(
			discordTokens.accessToken,
		);

		if (!discordData.verified) {
			throw new HttpException(
				`Discord email not verified`,
				HttpStatus.BAD_REQUEST,
			);
		}

		const relatedAccounts = await this.accountRepository.getManyByDiscord({
			discordId: discordData.id,
			email: discordData.email,
		});

		let account: AccountEntity;

		if (relatedAccounts.length > 0) {
			const sameDiscordId = relatedAccounts.find(
				(a) => a.discordId === discordData.id,
			);
			const sameEmail = relatedAccounts.find(
				(a) => a.email === discordData.email,
			);

			// Has an account with the same email, and it
			// isn't linked with another discord account
			// or it has only one account
			if (
				sameEmail &&
				!sameDiscordId &&
				(!sameEmail.discordId ||
					sameEmail.discordId === sameDiscordId.discordId)
			) {
				account = sameEmail;
			}
			// Account with same discord id (it can have a different email,
			// in case that the user updated it in discord)
			if ((sameDiscordId && !sameEmail) || (sameDiscordId && sameEmail)) {
				account = sameDiscordId;
			}
			if (!account) {
				throw new HttpException(
					`Error finding account, please contact support`,
					HttpStatus.CONFLICT,
				);
			}

			const dmChannelId = await this.discordAdapter.getUserDmChannelId(
				discordData.id,
			);

			await this.accountRepository.updateDiscord({
				accountId: account.accountId,
				discordId: discordData.id,
				discord: {
					username: discordData.username,
					dmChannelId,
					...discordTokens,
				},
			});
		} else {
			const dmChannelId = await this.discordAdapter.getUserDmChannelId(
				discordData.id,
			);

			account = await this.accountRepository.create({
				email: discordData.email,
				notifyThrough: PlatformEnum.DISCORD,
				discord: {
					username: discordData.username,
					dmChannelId,
					...discordTokens,
				},
			});
		}

		const accessToken = this.tokenAdapter.gen({
			accountId: account.accountId,
			isAdmin: account.isAdmin,
		});

		return {
			accessToken,
		};
	}

	async sendMagicLink({ email }: SendMagicLinkInput): Promise<void> {
		let account = await this.accountRepository.getByEmail({ email });

		if (!account) {
			account = await this.accountRepository.create({
				email,
				notifyThrough: PlatformEnum.EMAIL,
			});
		}

		const { code } = await this.magicLinkCodeRepository.upsert({
			accountId: account.accountId,
		});

		await this.notificationUsecase.sendNotification({
			accountId: account.accountId,
			title: 'Seu link de login chegou!',
			description: `${process.env['FRONT_URL']}/auth/email?accountId=${account.accountId}&code=${code}`,
		});
	}

	async createFromMagicLink({
		accountId,
		code,
	}: CreateFromMagicLinkInput): Promise<AuthOutput> {
		const magicLinkCode = await this.magicLinkCodeRepository.get({
			accountId,
			code,
		});

		if (!magicLinkCode) {
			throw new HttpException('Invalid code', HttpStatus.NOT_FOUND);
		}

		const user = await this.accountRepository.getByAccountId({
			accountId,
		});

		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}

		const accessToken = this.tokenAdapter.gen({
			accountId,
			isAdmin: user.isAdmin,
		});

		return {
			accessToken,
		};
	}

	async acceptTerms({ semVer, accountId }: AcceptInput): Promise<void> {
		const terms = await this.termsRepository.get({
			semVer,
		});

		if (!terms) {
			throw new HttpException('Invalid terms version', HttpStatus.NOT_FOUND);
		}

		const user = await this.accountRepository.getByAccountId({
			accountId,
		});

		if (!user) {
			throw new HttpException('Invalid user', HttpStatus.FORBIDDEN);
		}

		const isNewVersion = this.versionAdapter.isGt({
			toValidate: semVer,
			compareWith: user.lastTermsAccepted?.semVer,
		});

		if (!isNewVersion) {
			throw new HttpException('Version is to old', HttpStatus.BAD_REQUEST);
		}

		await this.accountRepository.updateTerms({
			accountId,
			lastTermsAccepted: {
				semVer,
			},
		});
	}

	async iam(i: IamInput): Promise<IamOutput> {
		const [account, store, document] = await Promise.all([
			this.accountRepository.getByAccountId(i),
			this.storeRepository.getByAccountId(i),
			this.documentRepository.getByAccountId(i),
		]);

		if (!account) {
			throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
		}

		return {
			accountId: account.accountId,
			isAdmin: account.isAdmin,
			dvs: document?.status || DocumentStatusEnum['00'],
			...(account.discord
				? {
						discord: {
							id: account.discordId,
							username: account.discord.username,
						},
				  }
				: {}),
			...(store
				? {
						store: {
							id: store.storeId,
							color: store.color,
						},
				  }
				: {}),
		};
	}
}
