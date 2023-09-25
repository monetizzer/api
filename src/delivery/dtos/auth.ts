import { IsNotEmpty } from 'class-validator';
import { IsDiscordCode } from '../validators/discord';

export class CreateFromDiscordOauthDto {
  @IsNotEmpty()
  @IsDiscordCode()
  code: string;
}
