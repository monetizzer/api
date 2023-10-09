import {
	Body,
	Controller,
	FileTypeValidator,
	Get,
	MaxFileSizeValidator,
	ParseFilePipe,
	Patch,
	Post,
	Query,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { StoreService } from 'src/usecases/store/store.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateDto, UpdateDto } from './dtos/store';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PaginatedDto } from './dtos';

@Controller('stores')
export class StoreController {
	constructor(private readonly storeService: StoreService) {}

	@Post('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(
		FileFieldsInterceptor([
			{
				name: 'banner',
				maxCount: 1,
			},
			{
				name: 'avatar',
				maxCount: 1,
			},
		]),
	)
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
		files: {
			banner?: Array<Express.Multer.File>;
			avatar?: Array<Express.Multer.File>;
		},
	) {
		const [banner] = files.banner || [];
		const [avatar] = files.avatar || [];

		return this.storeService.create({
			accountId,
			banner: banner.buffer,
			avatar: avatar.buffer,
			...body,
		});
	}

	@Patch('/')
	@UseGuards(AuthGuard(['USER']))
	@UseInterceptors(
		FileFieldsInterceptor([
			{
				name: 'banner',
				maxCount: 1,
			},
			{
				name: 'avatar',
				maxCount: 1,
			},
		]),
	)
	update(
		@Body()
		body: UpdateDto,
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
		files: {
			banner?: Array<Express.Multer.File>;
			avatar?: Array<Express.Multer.File>;
		},
	) {
		const [banner] = files.banner || [];
		const [avatar] = files.avatar || [];

		return this.storeService.update({
			accountId,
			banner: banner?.buffer,
			avatar: avatar?.buffer,
			...body,
		});
	}

	@Get('/new')
	async getNew(
		@Query()
		query: PaginatedDto,
	) {
		return this.storeService.getNew(query);
	}

	@Get('/best-sellers')
	async getBestSellers(
		@Query()
		query: PaginatedDto,
	) {
		return this.storeService.getBestSellers(query);
	}
}
