import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import {
	ContentEntity,
	ContentUseCase,
	CreateContentInput,
	CreateContentOutput,
	GetByProductInput,
	GetInput,
} from 'src/models/content';
import { ProductEntity } from 'src/models/product';
import { ContentRepositoryService } from 'src/repositories/mongodb/content/content-repository.service';
import { ProductRepositoryService } from 'src/repositories/mongodb/product/product-repository.service';
import { SaleRepositoryService } from 'src/repositories/mongodb/sale/sale-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { canBeEdited } from 'src/types/enums/product-status';
import { isPreMadeProduct } from 'src/types/enums/product-type';
import { PaginatedItems } from 'src/types/paginated-items';

interface ValidateCanGetContentInput {
	accountId: string;
	storeId?: string;
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
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async create({
		storeId,
		productId,
		type,
		media,
		ext,
	}: CreateContentInput): Promise<CreateContentOutput> {
		if (!storeId) {
			throw new ForbiddenException('Cannot create a content without a store');
		}

		const product = await this.productRepository.getByProductId({
			productId,
		});

		if (!product || product.storeId !== storeId) {
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
			filePath: `/contents/${storeId}/${product.productId}/${contentId}.${ext}`,
			file: media,
		});

		await this.contentRepository.create({
			contentId,
			storeId,
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
		storeId,
		isAdmin,
		productId,
		contentId,
		ext,
	}: GetInput): Promise<Readable> {
		const product = await this.productRepository.getByProductId({
			productId,
		});

		if (!product) {
			throw new NotFoundException('Product not found');
		}

		await this.validateCanGetContent({
			accountId,
			storeId,
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

	async getByProduct({
		productId,
		page,
		limit: originalLimit,
	}: GetByProductInput): Promise<PaginatedItems<ContentEntity>> {
		// This route doesn't have any validation because the `get`
		// route already validates if the user can get the images

		const { offset, limit, paging } = this.utilsAdapter.pagination({
			page,
			limit: originalLimit,
		});

		const contents = await this.contentRepository.getMany({
			productId,
			limit,
			offset,
		});

		return {
			paging,
			data: contents,
		};
	}

	// Private

	async validateCanGetContent({
		isAdmin,
		accountId,
		storeId,
		product,
	}: ValidateCanGetContentInput) {
		if (isAdmin) return;

		if (storeId === product.storeId) return;

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
