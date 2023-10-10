import {
	BadRequestException,
	Body,
	Controller,
	FileTypeValidator,
	Get,
	HttpCode,
	HttpStatus,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Patch,
	Post,
	Query,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ProductService } from 'src/usecases/product/product.service';
import { AuthGuard } from './guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
	CreateDto,
	GetOneToReviewDto,
	GetApprovedStoreProductsDto,
	MarkAsReadyDto,
	ReviewDto,
	GetStoreProductsDto,
	GetProductDto,
} from './dtos/product';
import { AdminGuard } from './guards/admin.guard';
import { PaginatedDto, UserDataDto } from './dtos';
import { UserData } from './decorators/user-data';

@Controller('products')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(FilesInterceptor('previewImages'))
	create(
		@Body()
		body: CreateDto,
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
		files: Array<Express.Multer.File>,
	) {
		if (!files || files.length < 1) {
			throw new BadRequestException('Needs at least 1 preview image');
		}

		return this.productService.create({
			...body,
			storeId: userData.storeId,
			previewImages: files.map((f) => f.buffer),
		});
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('/ready')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	markAsReady(
		@Body()
		body: MarkAsReadyDto,
		@UserData()
		UserData: UserDataDto,
	) {
		return this.productService.markAsReady({
			...body,
			storeId: UserData.storeId,
		});
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('/review')
	@UseGuards(AdminGuard)
	review(
		@Body()
		body: ReviewDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.productService.review({
			...body,
			reviewerId: userData.accountId,
		});
	}

	@Get('/new')
	async getNew(
		@Query()
		query: PaginatedDto,
	) {
		return this.productService.getNew(query);
	}

	@Get('/best-sellers')
	async getBestSellers(
		@Query()
		query: PaginatedDto,
	) {
		return this.productService.getBestSellers(query);
	}

	@Get('/review')
	@UseGuards(AdminGuard)
	getToReview(
		@Query()
		query: PaginatedDto,
	) {
		return this.productService.getToReview(query);
	}

	@Get('/review/:productId')
	@UseGuards(AdminGuard)
	getOneToReview(
		@Param()
		params: GetOneToReviewDto,
	) {
		return this.productService.getOneToReview(params);
	}

	@Get('/')
	getApprovedStoreProducts(
		@Query()
		query: GetApprovedStoreProductsDto,
	) {
		return this.productService.getApprovedStoreProducts(query);
	}

	@Get('/store')
	getStoreProducts(
		@Query()
		query: GetStoreProductsDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.productService.getStoreProducts({
			...query,
			storeId: userData.storeId,
		});
	}

	@Get('/:productId')
	getProduct(
		@Param()
		params: GetProductDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.productService.getProduct({
			...params,
			storeId: userData.storeId,
		});
	}
}
