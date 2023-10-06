import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AccountService } from 'src/usecases/account/account.service';
import {
	AcceptTermsDto,
	CreateFromDiscordOauthDto,
	CreateFromMagicLinkDto,
	SendMagicLinkDto,
} from './dtos/auth';
import { AuthGuard } from './guards/auth.guard';
import { AccountId } from './decorators/account-id';
import { Response } from 'express';
import { AuthOutput } from 'src/models/account';

@Controller('')
export class AuthController {
	constructor(private readonly accountService: AccountService) {}

	@Post('/auth/discord')
	async createFromDiscordOauth(
		@Body()
		body: CreateFromDiscordOauthDto,
		@Res({ passthrough: true })
		res: Response,
	) {
		const auth = await this.accountService.createFromDiscordOauth(body);

		this.setCookies(auth, res);
	}

	@Post('/auth/magic-link/gen-email')
	sendMagicLink(
		@Body()
		body: SendMagicLinkDto,
	) {
		return this.accountService.sendMagicLink(body);
	}

	@Post('/auth/magic-link')
	async createFromMagicLink(
		@Body()
		body: CreateFromMagicLinkDto,
		@Res({ passthrough: true })
		res: Response,
	) {
		const auth = await this.accountService.createFromMagicLink(body);

		this.setCookies(auth, res);
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

	// Private

	private setCookies({ accessToken }: AuthOutput, res: Response) {
		res.cookie('access-token', accessToken, {
			httpOnly: true,
			secure: process.env['NODE_ENV'] === 'production',
		});
	}
}
