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
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateDto, GetByProductDto, GetDto } from './dtos/content';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsAdmin } from './decorators/is-admin';
import { Response } from 'express';
import { PaginatedDto } from './dtos';

@Controller('contents')
export class ContentController {
	constructor(private readonly contentService: ContentService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(FileInterceptor('media'))
	create(
		@Body()
		body: CreateDto,
		@AccountId()
		accountId: string,
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
			accountId,
		});
	}

	@Get('/:storeId/:productId/:contentIdAndExt')
	@UseGuards(AuthGuard(['USER']))
	async get(
		@Param()
		params: GetDto,
		@AccountId()
		accountId: string,
		@IsAdmin()
		isAdmin: boolean,
		@Res()
		res: Response,
	) {
		const { productId, contentIdAndExt } = params;

		const [contentId, ext] = contentIdAndExt.split('.');

		const file = await this.contentService.get({
			productId,
			contentId,
			accountId,
			isAdmin,
			ext,
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
