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
	SendMagicLinkDto,
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

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('/auth/magic-link/gen-email')
	sendMagicLink(
		@Body()
		body: SendMagicLinkDto,
	) {
		return this.accountService.sendMagicLink(body);
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
		@AccountId()
		accountId: string,
	) {
		return this.accountService.acceptTerms({
			...body,
			accountId,
		});
	}

	@Get('/accounts/iam')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	iam(
		@AccountId()
		accountId: string,
	) {
		return this.accountService.iam({
			accountId,
		});
	}
}
