import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	GetInput,
	MagicLinkCodeEntity,
	MagicLinkCodeRepository,
	UpsertInput,
} from 'src/models/magic-link-code';
import { UIDSecretAdapter } from 'src/adapters/implementations/uid-secret.service';

interface MagicLinkCodeTable extends Omit<MagicLinkCodeEntity, 'accountId'> {
	_id: string;
}

@Injectable()
export class MagicLinkCodeRepositoryService implements MagicLinkCodeRepository {
	constructor(
		@InjectRepository('magic_link_codes')
		private readonly magicLinkCodeRepository: Repository<MagicLinkCodeTable>,
		private readonly secretAdapter: UIDSecretAdapter,
	) {}

	async upsert({ accountId }: UpsertInput): Promise<MagicLinkCodeEntity> {
		await this.magicLinkCodeRepository.updateOne(
			{
				_id: accountId,
			},
			{
				_id: accountId,
				code: this.secretAdapter.gen(),
				createdAt: new Date(),
			},
			{
				upsert: true,
			},
		);

		const magicLinkCode = await this.magicLinkCodeRepository.findOne({
			_id: accountId,
		});

		const { _id, ...magicLinkCodeData } = magicLinkCode;

		return {
			...magicLinkCodeData,
			accountId: _id,
		};
	}

	async get({
		accountId,
		code,
	}: GetInput): Promise<undefined | MagicLinkCodeEntity> {
		const magicLinkCode = await this.magicLinkCodeRepository.findOne({
			_id: accountId,
			code: code as unknown,
		});

		if (!magicLinkCode) return;

		const { _id, ...magicLinkCodeData } = magicLinkCode;

		return {
			...magicLinkCodeData,
			accountId: _id,
		};
	}
}
