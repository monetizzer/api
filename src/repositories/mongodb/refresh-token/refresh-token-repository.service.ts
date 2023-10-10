import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	CreateOutput,
	DeleteInput,
	GetInput,
	RefreshTokenEntity,
	RefreshTokenRepository,
} from 'src/models/refresh-token';
import { UIDSecretAdapter } from 'src/adapters/implementations/uid-secret.service';

interface RefreshTokenTable extends Omit<RefreshTokenEntity, 'refreshToken'> {
	_id: string;
}

@Injectable()
export class RefreshTokenRepositoryService implements RefreshTokenRepository {
	constructor(
		@InjectRepository('refresh_tokens')
		private readonly refreshTokenRepository: Repository<RefreshTokenTable>,
		private readonly secretAdapter: UIDSecretAdapter,
	) {}

	async create({ accountId }: CreateInput): Promise<CreateOutput> {
		const refreshToken = this.secretAdapter.gen();

		await this.refreshTokenRepository.insertOne({
			_id: refreshToken,
			accountId,
			createdAt: new Date(),
		});

		return {
			refreshToken,
		};
	}

	async get({ refreshToken }: GetInput): Promise<RefreshTokenEntity> {
		const refreshTokenEntity = await this.refreshTokenRepository.findOne({
			_id: refreshToken,
		});

		if (!refreshTokenEntity) return;

		const { _id, ...refreshTokenData } = refreshTokenEntity;

		return {
			...refreshTokenData,
			refreshToken: _id,
		};
	}

	async delete({ refreshToken }: DeleteInput): Promise<void> {
		await this.refreshTokenRepository.deleteOne({
			_id: refreshToken,
		});
	}
}
