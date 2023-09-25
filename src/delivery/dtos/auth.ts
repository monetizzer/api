import { IsNotEmpty } from 'class-validator';
import { IsDiscordCode } from '../validators/discord';
import { IsID, IsMagicLinkCode } from '../validators/internal';

export class CreateFromDiscordOauthDto {
  @IsNotEmpty()
  @IsDiscordCode()
  code: string;
}

export class CreateFromMagicLinkDto {
  @IsNotEmpty()
  @IsID()
  accountId: string;

  @IsNotEmpty()
  @IsMagicLinkCode()
  code: string;
}
