import { IsOptional, IsString, Max } from 'class-validator';
import { IsHEXColor, IsUsername } from '../validators/internal';

export class CreateDto {
  @IsString()
  @IsUsername()
  username: string;

  @IsString()
  @Max(25)
  name: string;

  @IsString()
  @Max(500)
  description: string;

  @IsOptional()
  @IsString()
  @IsHEXColor()
  color?: string;

  @IsOptional()
  banner?: Buffer;

  @IsOptional()
  avatar?: Buffer;
}
