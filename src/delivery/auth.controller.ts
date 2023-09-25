import { Body, Controller, Post } from '@nestjs/common';
import { AccountService } from 'src/usecases/account/account.service';
import { CreateFromDiscordOauthDto } from './dtos/auth';

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
}
