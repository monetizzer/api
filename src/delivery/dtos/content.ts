import { IsEnum, IsIn, IsString } from 'class-validator';
import { ALL_MEDIA_EXT, MediaTypeEnum } from 'src/types/enums/media-type';
import { IsFileName, IsID } from '../validators/internal';

export class CreateDto {
	@IsID()
	productId: string;

	@IsEnum(MediaTypeEnum)
	type: MediaTypeEnum;

	@IsString()
	@IsIn(ALL_MEDIA_EXT)
	ext: string;
}

export class GetDto {
	@IsID()
	storeId: string;

	@IsID()
	productId: string;

	@IsFileName()
	contentIdAndExt: string;
}

export class GetByProductDto {
	@IsID()
	productId: string;
}
