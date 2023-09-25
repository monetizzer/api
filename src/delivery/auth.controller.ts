import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AccountService } from 'src/usecases/account/account.service';
import {
  AcceptTermsDto,
  CreateFromDiscordOauthDto,
  CreateFromMagicLinkDto,
} from './dtos/auth';
import { AuthGuard } from './guards/auth.guard';
import { AccountId } from './decorators/accountid';

@Controller('auth')
export class AuthController {
  constructor(private readonly accountService: AccountService) {}

  @Post('/discord')
  createFromDiscordOauth(
    @Body()
    body: CreateFromDiscordOauthDto,
  ) {
    return this.accountService.createFromDiscordOauth(body);
  }

  @Post('/magic-link')
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
}
