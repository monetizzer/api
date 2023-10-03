import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsHEXColor, IsID, IsUsername } from '../validators/internal';

export class CreateDto {
	@IsString()
	@IsUsername()
	username: string;

	@IsString()
	@MaxLength(25)
	name: string;

	@IsString()
	@MaxLength(500)
	description: string;

	@IsOptional()
	@IsString()
	@IsHEXColor()
	color?: string;
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
	@MaxLength(25)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description: string;

	@IsOptional()
	@IsString()
	@IsHEXColor()
	color?: string;
}
