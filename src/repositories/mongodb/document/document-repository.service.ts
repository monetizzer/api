import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	DocumentEntity,
	DocumentRepository,
	GetByAccountIdInput,
	GetManyInput,
	IsApprovedInput,
	UpdateStatusInput,
	UpsertCompleteInput,
} from 'src/models/document';
import { DocumentStatusEnum } from 'src/types/enums/document-status';
import { Filter } from 'mongodb';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

interface DocumentTable extends Omit<DocumentEntity, 'accountId'> {
	_id: string;
}

@Injectable()
export class DocumentRepositoryService implements DocumentRepository {
	constructor(
		@InjectRepository('documents')
		private readonly documentRepository: Repository<DocumentTable>,
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async isApproved({
		type,
		documentNumber,
	}: IsApprovedInput): Promise<boolean> {
		const document = await this.documentRepository.findOne({
			type,
			documentNumber,
			status: DocumentStatusEnum.AA,
		});

		return Boolean(document);
	}

	async getByAccountId({
		accountId,
	}: GetByAccountIdInput): Promise<undefined | DocumentEntity> {
		const document = await this.documentRepository.findOne({
			_id: accountId,
		});

		if (!document) return;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _id, ...documentData } = document;

		return {
			...documentData,
			accountId,
		};
	}

	async getMany({
		type,
		documentNumber,
		status,
	}: GetManyInput): Promise<DocumentEntity[]> {
		const filters: Filter<DocumentTable> = {};

		if (type) {
			filters.type = type;
		}

		if (documentNumber) {
			filters.documentNumber = documentNumber;
		}

		if (status) {
			filters.status = {
				$in: status,
			};
		}

		const documentsCursor = this.documentRepository.find(filters);
		const documents = await documentsCursor.toArray();

		return documents.map((document) => {
			const { _id, ...documentData } = document;

			return {
				...documentData,
				accountId: _id,
			};
		});
	}

	async updateStatus({
		accountId,
		status,
		message,
		reviewerId,
	}: UpdateStatusInput): Promise<void> {
		await this.documentRepository.updateOne(
			{
				_id: accountId,
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
					}),
				},
			},
		);
	}

	async upsertComplete({
		accountId,
		status,
		type,
		documentNumber,
		fullName,
		birthDate,
		phone,
		address,
		documentPictureUrl,
		selfieWithDocumentUrl,
	}: UpsertCompleteInput): Promise<void> {
		await this.documentRepository.updateOne(
			{
				_id: accountId,
			},
			{
				$set: {
					status,
					type,
					documentNumber,
					fullName,
					birthDate,
					phone,
					address,
					documentPictureUrl,
					selfieWithDocumentUrl,
				},
				$addToSet: {
					history: {
						timestamp: new Date(),
						status,
						type,
						documentNumber,
					},
				},
			},
			{
				upsert: true,
			},
		);
	}
}
