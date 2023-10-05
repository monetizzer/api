import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ContentService } from 'src/usecases/content/content.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateDto, GetDto } from './dtos/content';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsAdmin } from './decorators/is-admin';
import { Response } from 'express';

@Controller('contents')
export class ContentController {
	constructor(private readonly contentService: ContentService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(
		FileInterceptor('media', {
			limits: {
				fileSize: 20_000_000, // 20MB in bytes
			},
		}),
	)
	create(
		@Body()
		body: CreateDto,
		@AccountId()
		accountId: string,
		@UploadedFile()
		file: Express.Multer.File,
	) {
		return this.contentService.create({
			...body,
			media: file.buffer,
			accountId,
		});
	}

	@Get(':productId/:contentIdAndExt')
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
}
