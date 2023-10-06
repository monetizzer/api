import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import {
	ContentUseCase,
	CreateContentInput,
	CreateContentOutput,
	GetInput,
} from 'src/models/content';
import { ProductEntity } from 'src/models/product';
import { ContentRepositoryService } from 'src/repositories/mongodb/content/content-repository.service';
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';

interface ValidateCanGetContentInput {
	accountId: string;
	isAdmin: boolean;
	product: ProductEntity;
}

@Injectable()
export class ContentService implements ContentUseCase {
	constructor(
		@Inject(ContentRepositoryService)
		private readonly contentRepository: ContentRepositoryService,
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		@Inject(ProductRepositoryService)
		private readonly productRepository: ProductRepositoryService,
		private readonly fileAdapter: S3Adapter,
		private readonly idAdapter: UIDAdapter,
	) {}

	async create({
		accountId,
		productId,
		type,
		media,
		ext,
	}: CreateContentInput): Promise<CreateContentOutput> {
		const store = await this.storeRepository.getByAccountId({
			accountId,
		});

		if (!store) {
			throw new ForbiddenException('Cannot create a content without a store');
		}

		const product = await this.productRepository.get({
			productId,
		});

		if (!product) {
			throw new NotFoundException('Product not found');
		}

		const contentId = this.idAdapter.gen();

		const path = await this.fileAdapter.save({
			folder: process.env['PRIVATE_BUCKET_NAME'],
			filePath: `/contents/${product.storeId}/${contentId}.${ext}`,
			file: media,
		});

		await this.contentRepository.create({
			contentId,
			storeId: product.storeId,
			productId,
			type,
			mediaUrl: `${process.env['API_URL']}/${path}`,
		});

		return {
			contentId,
			mediaUrl: `${process.env['API_URL']}/${path}`,
		};
	}

	async get({
		accountId,
		isAdmin,
		productId,
		contentId,
		ext,
	}: GetInput): Promise<Readable> {
		const product = await this.productRepository.get({
			productId,
		});

		if (!product) {
			throw new NotFoundException('Product not found');
		}

		await this.validateCanGetContent({
			accountId,
			isAdmin,
			product,
		});

		return this.fileAdapter
			.getReadStream({
				folder: process.env['PRIVATE_BUCKET_NAME'],
				filePath: `/contents/${product.storeId}/${contentId}.${ext}`,
			})
			.catch(() => {
				throw new NotFoundException('File not found');
			});
	}

	// Private

	async validateCanGetContent({
		isAdmin,
		accountId,
		product,
	}: ValidateCanGetContentInput) {
		if (isAdmin) return;

		const store = await this.storeRepository.getByAccountId({ accountId });

		if (store?.storeId === product.storeId) return;

		// TODO: Validate if user has a sale with the productId
		// https://app.clickup.com/30989429/v/dc/xhq3n-340/xhq3n-660?block=block-d88a9fdc-46c7-4189-b214-527caeba0fa8

		throw new ForbiddenException('Cannot access content');
	}
}
