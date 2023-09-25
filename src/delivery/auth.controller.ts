import { Body, Controller, Post } from '@nestjs/common';
import { AccountService } from 'src/usecases/account/account.service';
import { CreateFromDiscordOauthDto, CreateFromMagicLinkDto } from './dtos/auth';

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
}
