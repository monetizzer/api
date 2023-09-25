import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AccountEntity,
  AuthOutput,
  CreateFromDiscordInput,
} from 'src/models/account';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { JWTAdapter } from 'src/adapters/implementations/jwt.service';

@Injectable()
// export class AccountService implements AccountUseCase {
export class AccountService {
  requiredDiscordScopes = ['email'];

  constructor(
    @Inject(AccountRepositoryService)
    private readonly accountRepository: AccountRepositoryService,
    private readonly discordAdapter: DiscordJSAdapter,
    private readonly tokenAdapter: JWTAdapter,
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
        discord: {
          username: discordData.username,
          dmChannelId,
          ...discordTokens,
        },
      });
    }

    const accessToken = this.tokenAdapter.gen({
      accountId: account.accountId,
    });

    return {
      accessToken,
    };
  }
}
