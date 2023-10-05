import {
	BadRequestException,
	Body,
	Controller,
	Get,
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
import { CreateDto, MarkAsReadyDto, ReviewDto } from './dtos/product';
import { AdminGuard } from './guards/admin.guard';

@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(
		FilesInterceptor('previewImages', 5, {
			limits: {
				fileSize: 5_000_000, // 5MB in bytes
				files: 5,
			},
		}),
	)
	create(
		@Body()
		body: CreateDto,
		@AccountId()
		accountId: string,
		@UploadedFiles()
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
}
