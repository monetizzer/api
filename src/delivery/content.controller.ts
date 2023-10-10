import {
	Body,
	Controller,
	Get,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Post,
	Query,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ContentService } from 'src/usecases/content/content.service';
import { AuthGuard } from './guards/auth.guard';
import { CreateDto, GetByProductDto, GetDto } from './dtos/content';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PaginatedDto, UserDataDto } from './dtos';
import { UserData } from './decorators/user-data';

@Controller('contents')
export class ContentController {
	constructor(private readonly contentService: ContentService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(FileInterceptor('media'))
	create(
		@Body()
		body: CreateDto,
		@UserData()
		userData: UserDataDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [new MaxFileSizeValidator({ maxSize: 100_000_000 })],
			}),
		)
		file: Express.Multer.File,
	) {
		return this.contentService.create({
			...body,
			media: file.buffer,
			storeId: userData.storeId,
		});
	}

	@Get('/:storeId/:productId/:contentIdAndExt')
	@UseGuards(AuthGuard(['USER']))
	async get(
		@Param()
		params: GetDto,
		@UserData()
		userData: UserDataDto,
		@Res()
		res: Response,
	) {
		const { productId, contentIdAndExt } = params;

		const [contentId, ext] = contentIdAndExt.split('.');

		const file = await this.contentService.get({
			productId,
			contentId,
			ext,
			accountId: userData.accountId,
			storeId: userData.storeId,
			isAdmin: userData.isAdmin,
		});

		file.pipe(res);
	}

	@Get('/:productId')
	@UseGuards(AuthGuard(['USER']))
	async getByProduct(
		@Param()
		params: GetByProductDto,
		@Query()
		query: PaginatedDto,
	) {
		return this.contentService.getByProduct({
			...query,
			...params,
		});
	}
}
