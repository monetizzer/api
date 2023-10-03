import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccountService } from 'src/usecases/account/account.service';
import {
  AcceptTermsDto,
  CreateFromDiscordOauthDto,
  CreateFromMagicLinkDto,
} from './dtos/auth';
import { AuthGuard } from './guards/auth.guard';
import { AccountId } from './decorators/account-id';

@Controller('')
export class AuthController {
  constructor(private readonly accountService: AccountService) {}

  @Post('/auth/discord')
  createFromDiscordOauth(
    @Body()
    body: CreateFromDiscordOauthDto,
  ) {
    return this.accountService.createFromDiscordOauth(body);
  }

  @Post('/auth/magic-link')
  createFromMagicLink(
    @Body()
    body: CreateFromMagicLinkDto,
  ) {
    return this.accountService.createFromMagicLink(body);
  }

  @Post('/terms/accept')
  @UseGuards(AuthGuard(['USER']))
  acceptTerms(
    @Body()
    body: AcceptTermsDto,
    @AccountId()
    accountId: string,
  ) {
    return this.accountService.acceptTerms({
      ...body,
      accountId,
    });
  }

  @Get('/accounts/iam')
  @UseGuards(AuthGuard(['USER']))
  iam(
    @AccountId()
    accountId: string,
  ) {
    return this.accountService.iam({
      accountId,
    });
  }
}
