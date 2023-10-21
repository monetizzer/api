import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CompletePreMadeInput,
	CreateInput,
	CreateOutput,
	GetBySaleIdInput,
	GetManyInput,
	HasBoughtPreMadeProductInput,
	SaleEntity,
	SaleRepository,
	UpdateExpiredInput,
	UpdateStatusInput,
} from 'src/models/sale';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { SalesStatusEnum } from 'src/types/enums/sale-status';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';
import { Filter } from 'mongodb';
import { DateAdapter } from 'src/adapters/implementations/date.service';

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
		private readonly dateAdapter: DateAdapter,
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
				$addToSet: {
					history: this.utilsAdapter.cleanObj({
						timestamp: new Date(),
						status,
					}),
				},
			},
		);
	}

	async completePreMade({ saleId }: CompletePreMadeInput): Promise<void> {
		await this.saleRepository.updateOne(
			{
				_id: saleId,
			},
			{
				$set: {
					status: SalesStatusEnum.CONFIRMED_DELIVERY,
				},
				$addToSet: {
					history: {
						$each: [
							{
								timestamp: this.dateAdapter.nowPlus(1, 'seconds'),
								status: SalesStatusEnum.PAID,
							},
							{
								timestamp: this.dateAdapter.nowPlus(2, 'seconds'),
								status: SalesStatusEnum.DELIVERED,
							},
							{
								timestamp: this.dateAdapter.nowPlus(3, 'seconds'),
								status: SalesStatusEnum.CONFIRMED_DELIVERY,
							},
						],
					},
				},
			},
		);
	}

	async getBySaleId({
		saleId,
	}: GetBySaleIdInput): Promise<undefined | SaleEntity> {
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
		storeId,
		productId,
		status,
		limit,
		offset,
	}: GetManyInput): Promise<SaleEntity[]> {
		const filters: Filter<SaleTable> = {};

		if (storeId) {
			filters.storeId = storeId;
		}

		if (clientId) {
			filters.clientId = clientId;
		}

		if (productId) {
			filters.productId = productId;
		}

		if (status) {
			filters.status = {
				$in: status,
			};
		}

		const salesCursor = this.saleRepository.find(filters, {
			skip: offset,
			limit,
		});
		const sales = await salesCursor.toArray();

		return sales.map((sale) => {
			const { _id, ...saleData } = sale;

			return {
				...saleData,
				saleId: _id,
			};
		});
	}

	async hasBoughtPreMadeProduct({
		clientId,
		productId,
	}: HasBoughtPreMadeProductInput): Promise<boolean> {
		const sale = await this.saleRepository.findOne({
			clientId,
			productId,
			status: {
				$in: [
					SalesStatusEnum.PENDING,
					SalesStatusEnum.PAID,
					SalesStatusEnum.DELIVERED,
					SalesStatusEnum.IN_DISPUTE,
					SalesStatusEnum.CONFIRMED_DELIVERY,
				],
			},
		});

		return Boolean(sale);
	}

	async updateExpired({
		expirationInMinutes,
	}: UpdateExpiredInput): Promise<void> {
		const timeLimit = this.dateAdapter.nowPlus(-expirationInMinutes, 'minutes');

		await this.saleRepository.updateMany(
			{
				status: SalesStatusEnum.PENDING,
				paymentMethod: PaymentMethodEnum.PIX,
				createdAt: {
					$lt: timeLimit,
				},
			},
			{
				$set: {
					status: SalesStatusEnum.EXPIRED,
				},
				$addToSet: {
					history: {
						timestamp: new Date(),
						status: SalesStatusEnum.EXPIRED,
					},
				},
			},
		);
	}
}
