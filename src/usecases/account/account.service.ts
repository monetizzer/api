import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import {
	AcceptInput,
	AccountEntity,
	AccountUseCase,
	AuthOutput,
	CreateFromDiscordInput,
	ExchangeMagicLinkCodeInput,
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
				throw new BadRequestException('Invalid code');
			});

		const missingScopes = this.requiredDiscordScopes.filter(
			(s) => !scopes.includes(s),
		);

		if (missingScopes.length > 0) {
			throw new BadRequestException(
				`Missing required scopes: ${missingScopes.join(' ')}`,
			);
		}

		const discordData = await this.discordAdapter.getAuthenticatedUserData(
			discordTokens.accessToken,
		);

		if (!discordData.verified) {
			throw new BadRequestException(`Discord email not verified`);
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
				throw new ConflictException(
					`Error finding account, please contact support`,
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

		const [store, document] = await Promise.all([
			this.storeRepository.getByAccountId({
				accountId: account.accountId,
			}),
			this.documentRepository.getByAccountId({
				accountId: account.accountId,
			}),
		]);

		const accessToken = this.tokenAdapter.gen({
			accountId: account.accountId,
			storeId: store?.storeId,
			dvs: document?.status,
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
			account,
			templateId: 'MAGIC_LINK_LOGIN',
			data: {
				code,
			},
		});
	}

	async exchangeMagicLinkCode({
		accountId,
		code,
	}: ExchangeMagicLinkCodeInput): Promise<AuthOutput> {
		const magicLinkCode = await this.magicLinkCodeRepository.get({
			accountId,
			code,
		});

		if (!magicLinkCode) {
			throw new NotFoundException('Invalid code');
		}

		const [user, store, document] = await Promise.all([
			this.accountRepository.getByAccountId({
				accountId,
			}),
			this.storeRepository.getByAccountId({
				accountId,
			}),
			this.documentRepository.getByAccountId({
				accountId,
			}),
		]);

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const accessToken = this.tokenAdapter.gen({
			accountId,
			storeId: store?.storeId,
			dvs: document?.status,
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
			throw new NotFoundException('Invalid terms version');
		}

		const user = await this.accountRepository.getByAccountId({
			accountId,
		});

		if (!user) {
			throw new ForbiddenException('Invalid user');
		}

		const isNewVersion = this.versionAdapter.isGt({
			toValidate: semVer,
			compareWith: user.lastTermsAccepted?.semVer,
		});

		if (!isNewVersion) {
			throw new BadRequestException('Version is deprecated');
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
			throw new UnauthorizedException('User not found');
		}

		return {
			accountId: account.accountId,
			isAdmin: account.isAdmin,
			username: account.username,
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
