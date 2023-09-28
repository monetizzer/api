import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DiscordAdapter } from 'src/adapters/discord';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import {
  CreateCompleteInput,
  DocumentEntity,
  DocumentUseCase,
  StatusInput,
  StatusOutput,
} from 'src/models/document';
import { DocumentRepositoryService } from 'src/repositories/mongodb/document/document-repository.service';
import {
  DocumentStatusEnum,
  canChangeStatus,
} from 'src/types/enums/document-status';

@Injectable()
export class DocumentService implements DocumentUseCase {
  constructor(
    @Inject(DocumentRepositoryService)
    private readonly documentRepository: DocumentRepositoryService,
    private readonly fileAdapter: S3Adapter,
    private readonly discordAdapter: DiscordAdapter,
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
        throw new HttpException(
          'Document is being used for other person',
          HttpStatus.CONFLICT,
        );
      }

      if (
        isValidatingOrApproved.status === DocumentStatusEnum.AA &&
        isValidatingOrApproved.accountId === accountId
      ) {
        throw new HttpException(
          'Your documents are already approved',
          HttpStatus.CONFLICT,
        );
      }

      if (
        [DocumentStatusEnum.AV, DocumentStatusEnum.VV].includes(
          isValidatingOrApproved.status,
        ) &&
        isValidatingOrApproved.accountId === accountId
      ) {
        throw new HttpException(
          'Your documents are being validated',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const [document, documentPicturePath, selfieWithDocumentPath] =
      await Promise.all([
        this.documentRepository.getByAccountId({
          accountId,
        }),
        this.fileAdapter.save({
          file: documentPicture,
          filePath: `/${accountId}/document.jpeg`,
          folder: 'documents',
        }),
        this.fileAdapter.save({
          file: selfieWithDocument,
          filePath: `/${accountId}/selfie.jpeg`,
          folder: 'documents',
        }),
      ]);

    if (
      !canChangeStatus({
        oldStatus: document?.status,
        newStatus: DocumentStatusEnum.VV,
      })
    ) {
      throw new HttpException(
        'Unable to update documents',
        HttpStatus.CONFLICT,
      );
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
      documentPicturePath: `${process.env['PRIVATE_BUCKET_URL']}${documentPicturePath}`,
      selfieWithDocumentPath: `${process.env['PRIVATE_BUCKET_URL']}${selfieWithDocumentPath}`,
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
            url: `${process.env['BACKLOG_URL']}/documents`,
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
}
