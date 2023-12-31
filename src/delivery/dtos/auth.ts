import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsSemVer,
	IsString,
} from 'class-validator';
import { IsDiscordCode } from '../validators/discord';
import { IsID, IsSecretCode } from '../validators/internal';
import { IsURL } from '../validators/miscellaneous';

export class CreateFromDiscordOauthDto {
	@IsNotEmpty()
	@IsDiscordCode()
	code: string;

	@IsNotEmpty()
	@IsURL({ acceptLocalhost: process.env['NODE_ENV'] !== 'production' })
	origin: string;
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
	@IsSecretCode()
	code: string;
}

export class AcceptTermsDto {
	@IsNotEmpty()
	@IsSemVer()
	semVer: string;
}

export class RefreshTokenDto {
	@IsSecretCode()
	refreshToken: string;
}

export class IamUserDataDto {
	@IsOptional()
	@IsID()
	accountId?: string;
}

export class IamDto {
	@IsOptional()
	@IsString()
	discordId?: string;
}
