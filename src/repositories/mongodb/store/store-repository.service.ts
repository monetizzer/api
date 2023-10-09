import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	CreateOutput,
	GetByAccountIdInput,
	GetByStoreIdInput,
	GetByUsernameInput,
	GetManyInput,
	StoreEntity,
	StoreRepository,
	UpdateInput,
} from 'src/models/store';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { FindOptions } from 'mongodb';

interface StoreTable extends Omit<StoreEntity, 'storeId'> {
	_id: string;
}

@Injectable()
export class StoreRepositoryService implements StoreRepository {
	constructor(
		@InjectRepository('stores')
		private readonly storeRepository: Repository<StoreTable>,
		private readonly idAdapter: UIDAdapter,
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async getByStoreId({
		storeId,
	}: GetByStoreIdInput): Promise<undefined | StoreEntity> {
		const store = await this.storeRepository.findOne({
			_id: storeId,
		});

		if (!store) return;

		const { _id, ...storeData } = store;

		return {
			...storeData,
			storeId: _id,
		};
	}

	async getByAccountId({
		accountId,
	}: GetByAccountIdInput): Promise<undefined | StoreEntity> {
		const store = await this.storeRepository.findOne({
			accountId,
		});

		if (!store) return;

		const { _id, ...storeData } = store;

		return {
			...storeData,
			storeId: _id,
		};
	}

	async getByUsername({
		username,
	}: GetByUsernameInput): Promise<undefined | StoreEntity> {
		const store = await this.storeRepository.findOne({
			username,
		});

		if (!store) return;

		const { _id, ...storeData } = store;

		return {
			...storeData,
			storeId: _id,
		};
	}

	async getMany({
		offset,
		limit,
		orderBy,
	}: GetManyInput): Promise<StoreEntity[]> {
		let sort: FindOptions<StoreTable>['sort'] | undefined;

		if (orderBy) {
			const { storeId, ...order } = orderBy;

			sort = this.utilsAdapter.cleanObj({
				...order,
				_id: storeId,
			});
		}

		const storesCursor = this.storeRepository.find(
			{},
			{
				skip: offset,
				limit,
				sort,
			},
		);
		const stores = await storesCursor.toArray();

		return stores.map((store) => {
			const { _id, ...storeData } = store;

			return {
				...storeData,
				storeId: _id,
			};
		});
	}

	async create(i: CreateInput): Promise<CreateOutput> {
		const storeId = this.idAdapter.gen();

		await this.storeRepository.insertOne({
			...i,
			_id: storeId,
			createdAt: new Date(),
		});

		return {
			storeId,
		};
	}

	async update({ storeId, ...i }: UpdateInput): Promise<void> {
		await this.storeRepository.updateOne(
			{
				_id: storeId,
			},
			{
				$set: this.utilsAdapter.cleanObj(i),
			},
		);
	}
}
