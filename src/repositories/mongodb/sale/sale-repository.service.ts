import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	CreateOutput,
	GetBySaleIdInput,
	HasBoughtPreMadeProductInput,
	SaleEntity,
	SaleRepository,
	UpdateStatusInput,
} from 'src/models/sale';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { SalesStatusEnum } from 'src/types/enums/sale-status';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';

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

	async updateExpired(): Promise<void> {
		const timeLimit = new Date().getTime() - 16 * 60 * 1000;

		await this.saleRepository.updateMany(
			{
				status: SalesStatusEnum.PENDING,
				paymentMethod: PaymentMethodEnum.PIX,
				createdAt: {
					$lte: new Date(timeLimit),
				},
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
