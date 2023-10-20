import { Readable } from 'stream';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import {
	CreateCompleteInput,
	DocumentEntity,
	DocumentUseCase,
	GetByAccountIdInput,
	GetImageInput,
	ReviewInput,
} from 'src/models/document';
import { DocumentRepositoryService } from 'src/repositories/mongodb/document/document-repository.service';
import {
	DocumentStatusEnum,
	canChangeStatus,
} from 'src/types/enums/document-status';
import { NotificationService } from '../notification/notification.service';
import { DateAdapter } from 'src/adapters/implementations/date.service';
import { Paginated, PaginatedItems } from 'src/types/paginated-items';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

interface ValidateIfIsOfLegalAgeInput {
	birthDate: string;
	country: keyof typeof COUNTRIES_LEGAL_AGE;
}

const COUNTRIES_LEGAL_AGE = {
	BR: 18,
};

@Injectable()
export class DocumentService implements DocumentUseCase {
	constructor(
		@Inject(DocumentRepositoryService)
		private readonly documentRepository: DocumentRepositoryService,
		@Inject(NotificationService)
		private readonly notificationUsecase: NotificationService,
		private readonly fileAdapter: S3Adapter,
		private readonly dateAdapter: DateAdapter,
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async createComplete({
		accountId,
		type,
		documentNumber,
		fullName,
		birthDate,
		phone,
		address,
		documentPicture,
		selfieWithDocument,
	}: CreateCompleteInput): Promise<void> {
		this.validateIfIsOfLegalAge({
			birthDate,
			country: address.country as any,
		});

		const [isValidatingOrApproved] = await this.documentRepository.getMany({
			type,
			documentNumber,
			status: [
				DocumentStatusEnum.AA,
				DocumentStatusEnum.AV,
				DocumentStatusEnum.VV,
			],
		});

		if (isValidatingOrApproved) {
			if (
				isValidatingOrApproved.status === DocumentStatusEnum.AA &&
				isValidatingOrApproved.accountId !== accountId
			) {
				throw new ConflictException('Document is being used for other person');
			}

			if (
				isValidatingOrApproved.status === DocumentStatusEnum.AA &&
				isValidatingOrApproved.accountId === accountId
			) {
				throw new ConflictException('Your documents are already approved');
			}

			if (
				[DocumentStatusEnum.AV, DocumentStatusEnum.VV].includes(
					isValidatingOrApproved.status,
				) &&
				isValidatingOrApproved.accountId === accountId
			) {
				throw new ForbiddenException('Your documents are being validated');
			}
		}

		const [document, documentPicturePath, selfieWithDocumentPath] =
			await Promise.all([
				this.documentRepository.getByAccountId({
					accountId,
				}),
				this.fileAdapter.save({
					folder: process.env['PRIVATE_BUCKET_NAME'],
					filePath: `/documents/${accountId}/document.jpeg`,
					file: documentPicture,
				}),
				this.fileAdapter.save({
					folder: process.env['PRIVATE_BUCKET_NAME'],
					filePath: `/documents/${accountId}/selfie.jpeg`,
					file: selfieWithDocument,
				}),
			]);

		if (
			!canChangeStatus({
				oldStatus: document?.status,
				newStatus: DocumentStatusEnum.VV,
			})
		) {
			throw new ConflictException('Unable to update documents');
		}

		await Promise.all([
			this.documentRepository.upsertComplete({
				accountId,
				status: DocumentStatusEnum.VV,
				fullName,
				birthDate,
				phone,
				address,
				documentNumber,
				type,
				documentPictureUrl: `${process.env['API_URL']}${documentPicturePath}`,
				selfieWithDocumentUrl: `${process.env['API_URL']}${selfieWithDocumentPath}`,
			}),
			this.notificationUsecase.sendInternalNotification({
				templateId: 'NEW_DOCUMENT_TO_REVIEW',
			}),
		]);
	}

	async getToReview(i: Paginated): Promise<PaginatedItems<DocumentEntity>> {
		const { offset, limit, paging } = this.utilsAdapter.pagination(i);

		const documents = await this.documentRepository.getMany({
			status: [DocumentStatusEnum.VV],
			offset,
			limit,
		});

		return {
			paging,
			data: documents,
		};
	}

	async getDocumentByAccountId({
		accountId,
	}: GetByAccountIdInput): Promise<DocumentEntity> {
		return await this.documentRepository.getByAccountId({
			accountId,
		});
	}

	async review({
		accountId,
		authorId,
		approve,
		message,
	}: ReviewInput): Promise<void> {
		if (!approve && !message) {
			throw new BadRequestException(
				'Message is required if document is rejected',
			);
		}

		const document = await this.documentRepository.getByAccountId({
			accountId,
		});

		let status: DocumentStatusEnum;

		if (!approve) {
			if (document?.status.startsWith('A')) {
				status = DocumentStatusEnum.AR;
			} else {
				status = DocumentStatusEnum.RR;
			}
		} else {
			status = DocumentStatusEnum.AA;
		}

		if (
			!canChangeStatus({
				oldStatus: document.status,
				newStatus: status,
			})
		) {
			throw new BadRequestException(
				`Can't change status from "${document.status}" to "${status}"`,
			);
		}

		await Promise.all([
			this.documentRepository.updateStatus({
				accountId,
				status,
				authorId,
				message,
			}),
			this.notificationUsecase.sendInternalNotification({
				templateId: approve ? 'NEW_DOCUMENT_APPROVED' : 'NEW_DOCUMENT_REPROVED',
				data: {
					accountId,
					authorId,
					message,
				},
			}),
			this.notificationUsecase.sendNotification({
				accountId,
				templateId: approve ? 'DOCUMENTS_APPROVED' : 'DOCUMENTS_REPROVED',
				data: {
					message,
				},
			}),
		]);
	}

	async getImage({ accountId, name }: GetImageInput): Promise<Readable> {
		return this.fileAdapter
			.getReadStream({
				folder: process.env['PRIVATE_BUCKET_NAME'],
				filePath: `/documents/${accountId}/${name}`,
			})
			.catch(() => {
				throw new NotFoundException('File not found');
			});
	}

	// Private

	private validateIfIsOfLegalAge({
		birthDate,
		country,
	}: ValidateIfIsOfLegalAgeInput) {
		const minAge = COUNTRIES_LEGAL_AGE[country];

		if (!minAge) {
			throw new ForbiddenException("Your country isn't supported for now");
		}

		if (
			!this.dateAdapter.isOfLegalAge({
				birthDate,
				minAge,
			})
		) {
			throw new BadRequestException('You must be at least 18');
		}
	}
}
