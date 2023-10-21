import {
	BadRequestException,
	Body,
	Controller,
	FileTypeValidator,
	Get,
	Header,
	HttpCode,
	HttpStatus,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Post,
	Query,
	Res,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { DocumentService } from 'src/usecases/document/document.service';
import { AuthGuard } from './guards/auth.guard';
import { CreateCompleteDto, GetImageDto, ReviewDto } from './dtos/document';
import { AdminGuard } from './guards/admin.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PaginatedDto, UserDataDto } from './dtos';
import { UserData } from './decorators/user-data';

@Controller('documents')
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('complete')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(
		FileFieldsInterceptor([
			{
				name: 'documentPicture',
				maxCount: 1,
			},
			{
				name: 'selfieWithDocument',
				maxCount: 1,
			},
		]),
	)
	createComplete(
		@Body()
		body: CreateCompleteDto,
		@UserData()
		userData: UserDataDto,
		@UploadedFiles(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 10_000_000 }),
					new FileTypeValidator({ fileType: /^image\// }),
				],
			}),
		)
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
			accountId: userData.accountId,
			documentPicture: documentPicture.buffer,
			selfieWithDocument: selfieWithDocument.buffer,
			...body,
		});
	}

	@Get('review')
	@UseGuards(AdminGuard)
	getToReview(
		@Query()
		query: PaginatedDto,
	) {
		return this.documentService.getToReview(query);
	}

	@Get(':accountId/:name')
	@UseGuards(AdminGuard)
	@Header('Content-type', 'image/jpeg')
	async getImage(
		@Param()
		params: GetImageDto,
		@Res()
		res: Response,
	) {
		const file = await this.documentService.getImage(params);

		file.pipe(res);
	}

	@Get('/me')
	@UseGuards(AuthGuard(['USER']))
	getOwnDocument(
		@UserData()
		userData: UserDataDto,
	) {
		return this.documentService.getOwnDocument({
			accountId: userData.accountId,
		});
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('review')
	@UseGuards(AdminGuard)
	review(
		@Body()
		body: ReviewDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.documentService.review({
			authorId: userData.accountId,
			...body,
		});
	}
}
