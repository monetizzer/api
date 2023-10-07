import {
	BadRequestException,
	Body,
	Controller,
	FileTypeValidator,
	Get,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Patch,
	Post,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ProductService } from 'src/usecases/product/product.service';
import { AuthGuard } from './guards/auth.guard';
import { AccountId } from './decorators/account-id';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
	CreateDto,
	GetOneToReviewDto,
	MarkAsReadyDto,
	ReviewDto,
} from './dtos/product';
import { AdminGuard } from './guards/admin.guard';

@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(FilesInterceptor('previewImages'))
	create(
		@Body()
		body: CreateDto,
		@AccountId()
		accountId: string,
		@UploadedFiles(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 10_000_000 }),
					new FileTypeValidator({ fileType: /^image\// }),
				],
			}),
		)
		files: Array<Express.Multer.File>,
	) {
		if (!files || files.length < 1) {
			throw new BadRequestException('Needs at least 1 preview image');
		}

		return this.productService.create({
			...body,
			accountId,
			previewImages: files.map((f) => f.buffer),
		});
	}

	@Patch('/ready')
	@UseGuards(AuthGuard(['USER']))
	markAsReady(
		@Body()
		body: MarkAsReadyDto,
		@AccountId()
		accountId: string,
	) {
		return this.productService.markAsReady({
			...body,
			accountId,
		});
	}

	@Post('review')
	@UseGuards(AdminGuard)
	review(
		@Body()
		body: ReviewDto,
		@AccountId()
		reviewerId: string,
	) {
		return this.productService.review({
			...body,
			reviewerId,
		});
	}

	@Get('review')
	@UseGuards(AdminGuard)
	getToReview() {
		return this.productService.getToReview();
	}

	@Get('review/:productId')
	@UseGuards(AdminGuard)
	getOneToReview(
		@Param()
		params: GetOneToReviewDto,
	) {
		return this.productService.getOneToReview(params);
	}
}
