import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class LatestDto {
	@IsOptional()
	@IsBoolean()
	@Transform((value) => Boolean(value))
	semVer?: boolean;
}
