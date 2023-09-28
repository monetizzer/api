import { IsOptional, IsString, Max } from 'class-validator';
import { IsHEXColor, IsID, IsUsername } from '../validators/internal';

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

export class UpdateDto {
  @IsID()
  storeId: string;

  @IsOptional()
  @IsString()
  @IsUsername()
  username: string;

  @IsOptional()
  @IsString()
  @Max(25)
  name: string;

  @IsOptional()
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
