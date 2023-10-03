import {
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';
import { DocumentTypeEnum } from 'src/types/enums/document-type';
import { IsDateYYYYMMDD } from '../validators/date';
import { IsID } from '../validators/internal';
import { Transform } from 'class-transformer';

class DocumentAddressDto {
	@IsString()
	@MaxLength(150)
	line1: string;

	@IsString()
	@MaxLength(150)
	line2: string;

	@IsString()
	@MaxLength(50)
	postalCode: string;

	@IsString()
	@MaxLength(50)
	city: string;

	@IsString()
	@MaxLength(50)
	state: string;

	@IsString()
	@MaxLength(50)
	country: string;
}

export class CreateCompleteDto {
	@IsString()
	@IsEnum(DocumentTypeEnum)
	type: DocumentTypeEnum;

	@IsString()
	@MaxLength(150)
	documentNumber: string;

	@IsString()
	@MaxLength(150)
	fullName: string;

	@IsString()
	@IsDateYYYYMMDD()
	birthDate: string;

	@IsString()
	@MaxLength(50)
	phone: string;

	@IsObject()
	@Transform(({ value }) => JSON.parse(value))
	address: DocumentAddressDto;
}

export class ReviewDto {
	@IsString()
	@IsID()
	accountId: string;

	@IsBoolean()
	approve: boolean;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(1000)
	message?: string;
}
