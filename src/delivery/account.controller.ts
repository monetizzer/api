import { Controller, Post } from '@nestjs/common';

@Controller('account')
export class AccountController {
  @Post('/discord')
  public createWithDiscord() {}
}
