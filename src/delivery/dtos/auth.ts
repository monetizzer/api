import { IsEmail, IsNotEmpty, IsSemVer, IsString } from 'class-validator';
import { IsDiscordCode } from '../validators/discord';
import { IsID, IsMagicLinkCode } from '../validators/internal';

export class CreateFromDiscordOauthDto {
	@IsNotEmpty()
	@IsDiscordCode()
	code: string;
}

export class SendMagicLinkDto {
	@IsEmail()
	email: string;
}

export class SendMagicLinkDiscordDto {
	@IsString()
	discordId: string;
}

export class CreateFromMagicLinkDto {
	@IsNotEmpty()
	@IsID()
	accountId: string;

	@IsNotEmpty()
	@IsMagicLinkCode()
	code: string;
}

export class AcceptTermsDto {
	@IsNotEmpty()
	@IsSemVer()
	semVer: string;
}
