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
	GetImageInput,
	ReviewInput,
	StatusInput,
	StatusOutput,
} from 'src/models/document';
import { DocumentRepositoryService } from 'src/repositories/mongodb/document/document-repository.service';
import {
	DocumentStatusEnum,
	canChangeStatus,
} from 'src/types/enums/document-status';
import { NotificationService } from '../notification/notification.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { DateAdapter } from 'src/adapters/implementations/date.service';

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
		private readonly discordAdapter: DiscordJSAdapter,
		private readonly dateAdapter: DateAdapter,
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
					folder: 'private',
					filePath: `/documents/${accountId}/document.jpeg`,
					file: documentPicture,
				}),
				this.fileAdapter.save({
					folder: 'private',
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

		await this.documentRepository.upsertComplete({
			accountId,
			status: DocumentStatusEnum.VV,
			fullName,
			birthDate,
			phone,
			address,
			documentNumber,
			type,
			documentPictureUrl: `${process.env['API_URL']}/${documentPicturePath}`,
			selfieWithDocumentUrl: `${process.env['API_URL']}/${selfieWithDocumentPath}`,
		});

		await this.discordAdapter.sendMessage({
			channelId: this.discordAdapter.channels.DOCUMENTS,
			content: '@everyone',
			embeds: [
				{
					title: 'Novos documentos a serem validados',
				},
			],
			components: [
				[
					{
						style: 'link',
						url: `${process.env['BACKOFFICE_URL']}/documents`,
						label: 'Ver documentos',
					},
				],
			],
		});
	}

	async status(i: StatusInput): Promise<StatusOutput> {
		const document = await this.documentRepository.getByAccountId(i);

		return {
			status: document.status || DocumentStatusEnum['00'],
		};
	}

	async getToReview(): Promise<DocumentEntity[]> {
		const documents = await this.documentRepository.getMany({
			status: [DocumentStatusEnum.VV],
		});

		return documents;
	}

	async review({
		accountId,
		reviewerId,
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
				reviewerId,
				message,
			}),
			this.discordAdapter.sendMessage({
				channelId: this.discordAdapter.channels.DOCUMENTS,
				content: '@everyone',
				embeds: [
					{
						title: `Novo documento ${approve ? 'aprovado' : 'reprovado'}.`,
						fields: [
							{
								name: 'AccountId',
								value: accountId,
								inline: true,
							},
							{
								name: 'ReviewerId',
								value: reviewerId,
								inline: true,
							},
						],
						color: approve ? '#e81212' : '#12e820',
						timestamp: new Date(),
					},
				],
			}),
			this.notificationUsecase.sendNotification(
				approve
					? {
							accountId,
							title: 'Parabés, seus documentos foram aprovados!',
							description:
								'Entre em nossa plataforma agora para continuar de onde você parou!',
							data: {
								color: '#12e820',
							},
					  }
					: {
							accountId,
							title: 'Que pena, seus documentos foram reprovados!',
							description: [
								'Motivo:',
								'```',
								message,
								'```',
								'',
								'Para resolver isso, corrija os problemas apontados e envie seus documentos novamente.',
							].join('\n'),
							data: {
								color: '#e81212',
							},
					  },
			),
		]);
	}

	async getImage({ type, name }: GetImageInput): Promise<Readable> {
		return this.fileAdapter
			.getReadStream({
				folder: 'documents',
				filePath: `${type}/${name}`,
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
