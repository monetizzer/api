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
import { SaleRepositoryService } from 'src/repositories/mongodb/sale/sale-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { canBeEdited } from 'src/types/enums/product-status';
import { isPreMadeProduct } from 'src/types/enums/product-type';

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
		@Inject(SaleRepositoryService)
		private readonly saleRepository: SaleRepositoryService,
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

		if (!canBeEdited(product)) {
			throw new NotFoundException(
				`Product with status "${product.status}" cannot be edited`,
			);
		}

		const contentId = this.idAdapter.gen();

		const path = await this.fileAdapter.save({
			folder: process.env['PRIVATE_BUCKET_NAME'],
			filePath: `/contents/${product.storeId}/${product.productId}/${contentId}.${ext}`,
			file: media,
		});

		await this.contentRepository.create({
			contentId,
			storeId: product.storeId,
			productId,
			type,
			mediaUrl: `${process.env['API_URL']}${path}`,
		});

		return {
			contentId,
			mediaUrl: `${process.env['API_URL']}${path}`,
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
				filePath: `/contents/${product.storeId}/${product.productId}/${contentId}.${ext}`,
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

		if (isPreMadeProduct(product.type)) {
			const hasBoughtPreMadeProduct =
				await this.saleRepository.hasBoughtPreMadeProduct({
					clientId: accountId,
					productId: product.productId,
				});

			if (hasBoughtPreMadeProduct) return;
		}

		throw new ForbiddenException('Cannot access content');
	}
}
