import {
	Body,
	Controller,
	FileTypeValidator,
	Get,
	HttpCode,
	HttpStatus,
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
import { AuthGuard } from './guards/auth.guard';
import { CreateDto, UpdateDto } from './dtos/store';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PaginatedDto, UserDataDto } from './dtos';
import { UserData } from './decorators/user-data';

@Controller('stores')
export class StoreController {
	constructor(private readonly storeService: StoreService) {}

	@HttpCode(HttpStatus.NO_CONTENT)
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
			banner?: Array<Express.Multer.File>;
			avatar?: Array<Express.Multer.File>;
		},
	) {
		const [banner] = files.banner || [];
		const [avatar] = files.avatar || [];

		return this.storeService.create({
			...body,
			accountId: userData.accountId,
			banner: banner.buffer,
			avatar: avatar.buffer,
		});
	}

	@HttpCode(HttpStatus.NO_CONTENT)
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
			banner?: Array<Express.Multer.File>;
			avatar?: Array<Express.Multer.File>;
		},
	) {
		const [banner] = files.banner || [];
		const [avatar] = files.avatar || [];

		return this.storeService.update({
			...body,
			accountId: userData.accountId,
			storeId: userData.storeId,
			banner: banner?.buffer,
			avatar: avatar?.buffer,
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
