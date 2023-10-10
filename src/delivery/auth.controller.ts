import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common';
import { AccountService } from 'src/usecases/account/account.service';
import {
	AcceptTermsDto,
	CreateFromDiscordOauthDto,
	CreateFromMagicLinkDto,
	SendMagicLinkDiscordDto,
	SendMagicLinkDto,
} from './dtos/auth';
import { AuthGuard } from './guards/auth.guard';
import { UserData } from './decorators/user-data';
import { UserDataDto } from './dtos';

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

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('/auth/magic-link/gen-email')
	sendMagicLink(
		@Body()
		body: SendMagicLinkDto,
	) {
		return this.accountService.sendMagicLink(body);
	}

	@Post('/auth/magic-link/gen-discord')
	@UseGuards(AuthGuard(['BOT']))
	sendMagicLinkDiscord(
		@Body()
		body: SendMagicLinkDiscordDto,
	) {
		return this.accountService.sendMagicLinkDiscord(body);
	}

	@Post('/auth/magic-link')
	exchangeMagicLinkCode(
		@Body()
		body: CreateFromMagicLinkDto,
	) {
		return this.accountService.exchangeMagicLinkCode(body);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('/terms/accept')
	@UseGuards(AuthGuard(['USER']))
	acceptTerms(
		@Body()
		body: AcceptTermsDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.accountService.acceptTerms({
			...body,
			accountId: userData.accountId,
		});
	}

	@Get('/accounts/iam')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	iam(
		@UserData()
		userData: UserDataDto,
	) {
		return this.accountService.iam({
			accountId: userData.accountId,
		});
	}
}
