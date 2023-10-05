import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import {
	ContentUseCase,
	CreateContentInput,
	CreateContentOutput,
} from 'src/models/content';
import { ContentRepositoryService } from 'src/repositories/mongodb/content/content-repository.service';
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';

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
			folder: 'private',
			filePath: `/contents/${product.storeId}/${contentId}${ext}`,
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
}
