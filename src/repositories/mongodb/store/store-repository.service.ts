import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	CreateOutput,
	GetByAccountIdInput,
	GetByStoreIdInput,
	GetByUsernameInput,
	StoreEntity,
	StoreRepository,
	UpdateInput,
} from 'src/models/store';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

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
