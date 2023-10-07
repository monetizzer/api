import { Transform } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';
import { IsHEXColor, IsID, IsPrice } from '../validators/internal';
import { ProductTypeEnum } from 'src/types/enums/product-type';

export class CreateDto {
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

	@IsPrice()
	@Transform(({ value }) => parseFloat(value))
	price: number;
}

export class MarkAsReadyDto {
	@IsID()
	productId: string;
}

export class ReviewDto {
	@IsID()
	productId: string;

	@IsBoolean()
	approve: boolean;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(1000)
	message?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@IsNotEmpty({ each: true })
	markedContentsIds?: Array<string>;
}

export class GetOneToReviewDto {
	@IsID()
	productId: string;
}
