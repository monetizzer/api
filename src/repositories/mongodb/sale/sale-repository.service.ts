import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	CreateOutput,
	GetInput,
	GetManyInput,
	SaleEntity,
	SaleRepository,
	UpdateStatusInput,
} from 'src/models/sale';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { Filter } from 'mongodb';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { SalesStatusEnum } from 'src/types/enums/sale-status';

interface SaleTable extends Omit<SaleEntity, 'saleId'> {
	_id: string;
}

@Injectable()
export class SaleRepositoryService implements SaleRepository {
	constructor(
		@InjectRepository('sales')
		private readonly saleRepository: Repository<SaleTable>,
		private readonly idAdapter: UIDAdapter,
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async create(i: CreateInput): Promise<CreateOutput> {
		const saleId = this.idAdapter.gen();

		await this.saleRepository.insertOne({
			...i,
			_id: saleId,
			status: SalesStatusEnum.PENDING,
			history: [
				{
					timestamp: new Date(),
					status: SalesStatusEnum.PENDING,
				},
			],
			createdAt: new Date(),
		});

		return {
			saleId,
		};
	}

	async updateStatus({ saleId, status }: UpdateStatusInput): Promise<void> {
		await this.saleRepository.updateOne(
			{
				_id: saleId,
			},
			{
				$set: {
					status,
				},
				$push: {
					history: this.utilsAdapter.cleanObj({
						timestamp: new Date(),
						status,
					}),
				},
			},
		);
	}

	async getBySaleId({ saleId }: GetInput): Promise<undefined | SaleEntity> {
		const sale = await this.saleRepository.findOne({
			_id: saleId,
		});

		if (!sale) return;

		const { _id, ...saleData } = sale;

		return {
			...saleData,
			saleId: _id,
		};
	}

	async getMany({
		clientId,
		productId,
		status,
	}: GetManyInput): Promise<SaleEntity[]> {
		const filters: Filter<SaleTable> = {};

		if (clientId) {
			filters.saleId = clientId;
		}

		if (productId) {
			filters.productId = productId;
		}

		if (status) {
			filters.status = {
				$in: status,
			};
		}

		const salesCursor = this.saleRepository.find(filters);
		const sales = await salesCursor.toArray();

		return sales.map((sale) => {
			const { _id, ...saleData } = sale;

			return {
				...saleData,
				saleId: _id,
			};
		});
	}

	async updateExpired(): Promise<void> {
		const timeLimit = new Date().getTime() - 16 * 60 * 1000;

		await this.saleRepository.updateMany(
			{
				status: SalesStatusEnum.PENDING,
				createdAt: { $lte: new Date(timeLimit) },
			},
			{
				$set: {
					status: SalesStatusEnum.EXPIRED,
				},
				$push: {
					history: this.utilsAdapter.cleanObj({
						timestamp: new Date(),
						status: SalesStatusEnum.EXPIRED,
					}),
				},
			},
		);
	}
}
