import {
	Body,
	Controller,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ContentService } from 'src/usecases/content/content.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateDto } from './dtos/content';
import { FileInterceptor } from '@nestjs/platform-express';

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
}
