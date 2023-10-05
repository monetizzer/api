import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	Post,
	Res,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { DocumentService } from 'src/usecases/document/document.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateCompleteDto, GetImageDto, ReviewDto } from './dtos/document';
import { AdminGuard } from './guards/admin.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('documents')
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Post('complete')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{
					name: 'documentPicture',
					maxCount: 1,
				},
				{
					name: 'selfieWithDocument',
					maxCount: 1,
				},
			],
			{
				limits: {
					fileSize: 5_000_000, // 5MB in bytes
					files: 2,
				},
			},
		),
	)
	createComplete(
		@Body()
		body: CreateCompleteDto,
		@AccountId()
		accountId: string,
		@UploadedFiles()
		files: {
			documentPicture?: Array<Express.Multer.File>;
			selfieWithDocument?: Array<Express.Multer.File>;
		},
	) {
		const [documentPicture] = files.documentPicture || [];
		const [selfieWithDocument] = files.selfieWithDocument || [];

		if (!documentPicture) {
			throw new BadRequestException('Missing documentPicture');
		}

		if (!selfieWithDocument) {
			throw new BadRequestException('Missing selfieWithDocument');
		}

		return this.documentService.createComplete({
			accountId,
			documentPicture: documentPicture.buffer,
			selfieWithDocument: selfieWithDocument.buffer,
			...body,
		});
	}

	@Get('status')
	@UseGuards(AuthGuard(['USER']))
	status(
		@AccountId()
		accountId: string,
	) {
		return this.documentService.status({ accountId });
	}

	@Get('review')
	@UseGuards(AdminGuard)
	getToReview() {
		return this.documentService.getToReview();
	}

	@Get(':type/:name')
	@UseGuards(AdminGuard)
	async getImage(
		@Param()
		params: GetImageDto,
		@Res()
		res: Response,
	) {
		const file = await this.documentService.getImage(params);

		file.pipe(res);
	}

	@Post('review')
	@UseGuards(AdminGuard)
	review(
		@Body()
		body: ReviewDto,
		@AccountId()
		reviewerId: string,
	) {
		return this.documentService.review({ reviewerId, ...body });
	}
}
