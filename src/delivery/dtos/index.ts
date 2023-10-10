import { Optional } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsOptional,
	Max,
	Min,
} from 'class-validator';
import { IsID } from '../validators/internal';
import { DocumentStatusEnum } from 'src/types/enums/document-status';

export class PaginatedDto {
	@Optional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Transform(({ value }) => parseFloat(value))
	page?: number;

	@Optional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Transform(({ value }) => parseFloat(value))
	limit?: number;
}

export class UserDataDto {
	@IsID()
	accountId: string;

	@IsOptional()
	@IsID()
	storeId?: string;

	@IsEnum(DocumentStatusEnum)
	dvs: DocumentStatusEnum;

	@IsBoolean()
	isAdmin: boolean;
}
