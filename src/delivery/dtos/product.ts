import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min,
} from 'class-validator';
import { IsHEXColor, IsID } from '../validators/internal';
import { ProductTypeEnum } from 'src/types/enums/product-type';

export class CreateDto {
	@IsOptional()
	@IsBoolean()
	@Transform((value) => Boolean(value))
	semVer?: boolean;

	@IsID()
	storeId: string;

	@IsEnum(ProductTypeEnum)
	type: ProductTypeEnum;

	@IsString()
	@MaxLength(30)
	name: string;

	@IsString()
	@MaxLength(500)
	description: string;

	@IsOptional()
	@IsHEXColor()
	color?: string;

	@IsInt()
	@Min(100)
	price: number;
}
