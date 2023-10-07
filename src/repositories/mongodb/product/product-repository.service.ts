import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	CreateOutput,
	GetByProductIdInput,
	GetManyInput,
	ProductEntity,
	ProductRepository,
	UpdateStatusInput,
} from 'src/models/product';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { ProductStatusEnum } from 'src/types/enums/product-status';
import { Filter } from 'mongodb';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

interface ProductTable extends Omit<ProductEntity, 'productId'> {
	_id: string;
}

@Injectable()
export class ProductRepositoryService implements ProductRepository {
	constructor(
		@InjectRepository('products')
		private readonly productRepository: Repository<ProductTable>,
		private readonly idAdapter: UIDAdapter,
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async create(i: CreateInput): Promise<CreateOutput> {
		const productId = this.idAdapter.gen();

		await this.productRepository.insertOne({
			...i,
			_id: productId,
			status: ProductStatusEnum.IN_PREPARATION,
			history: [
				{
					timestamp: new Date(),
					status: ProductStatusEnum.IN_PREPARATION,
				},
			],
			createdAt: new Date(),
		});

		return {
			productId,
		};
	}

	async updateStatus({
		productId,
		status,
		message,
		reviewerId,
		markedContentIds,
	}: UpdateStatusInput): Promise<void> {
		await this.productRepository.updateOne(
			{
				_id: productId,
			},
			{
				$set: {
					status,
				},
				$addToSet: {
					history: this.utilsAdapter.cleanObj({
						timestamp: new Date(),
						status,
						message,
						reviewerId,
						markedContentIds,
					}),
				},
			},
		);
	}

	async getByProductId({
		productId,
	}: GetByProductIdInput): Promise<undefined | ProductEntity> {
		const product = await this.productRepository.findOne({
			_id: productId,
		});

		if (!product) return;

		const { _id, ...productData } = product;

		return {
			...productData,
			productId: _id,
		};
	}

	async getMany({ storeId, status }: GetManyInput): Promise<ProductEntity[]> {
		const filters: Filter<ProductTable> = {};

		if (storeId) {
			filters.storeId = storeId;
		}

		if (status) {
			filters.status = {
				$in: status,
			};
		}

		const productsCursor = this.productRepository.find(filters);
		const products = await productsCursor.toArray();

		return products.map((product) => {
			const { _id, ...productData } = product;

			return {
				...productData,
				productId: _id,
			};
		});
	}
}
