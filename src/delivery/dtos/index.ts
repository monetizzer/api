import { Optional } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

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
