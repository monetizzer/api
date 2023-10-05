import { IsEnum, IsString } from 'class-validator';
import { MediaTypeEnum } from 'src/types/enums/media-type';

export class CreateDto {
	@IsString()
	productId: string;

	@IsEnum(MediaTypeEnum)
	type: MediaTypeEnum;

	@IsString()
	ext: string;
}
