import { DocumentTypeEnum } from 'src/types/enums/document-type';
import { DocumentStatusEnum } from 'src/types/enums/document-status';

interface DocumentHistoryItem {
  timestamp: Date;
  status: DocumentStatusEnum;
  type?: DocumentTypeEnum;
  documentNumber?: string;
  message?: string;
  reviewerId?: string;
}

interface DocumentAddress {
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

export interface DocumentEntity {
  accountId: string;
  status: DocumentStatusEnum;
  type: DocumentTypeEnum;
  documentNumber: string;
  history: Array<DocumentHistoryItem>;
  fullName: string;
  birthDate: string;
  phone?: string;
  address?: DocumentAddress;
  documentPictureUrl?: string;
  selfieWithDocumentUrl?: string;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface IsApprovedInput {
  type: DocumentTypeEnum;
  documentNumber: string;
}

export interface ApprovePartialInput {
  accountId: string;
}

export interface UpdateStatusInput {
  accountId: string;
  status: DocumentStatusEnum;
  message?: string;
  reviewerId?: string;
}

export interface UpsertCompleteInput {
  accountId: string;
  status: DocumentStatusEnum;
  type: DocumentTypeEnum;
  documentNumber: string;
  fullName: string;
  birthDate: string;
  phone: string;
  address: DocumentAddress;
  documentPicturePath: string;
  selfieWithDocumentPath: string;
}

export interface GetByAccountIdInput {
  accountId: string;
}

export interface GetManyInput {
  type?: DocumentTypeEnum;
  documentNumber?: string;
  status?: Array<DocumentStatusEnum>;
}

export interface DocumentRepository {
  // Checks if we already have an COMPLETE document with that same
  // number and type that is approved
  isApproved: (i: IsApprovedInput) => Promise<boolean>;

  updateStatus: (i: UpdateStatusInput) => Promise<void>;

  // We're gonna leave this to later, because we don't really know
  // what are the partial documents that we are required to ask
  // upsertPartial: (i: UpsertPartialInput) => Promise<void>;

  upsertComplete: (i: UpsertCompleteInput) => Promise<void>;

  getByAccountId: (i: GetByAccountIdInput) => Promise<DocumentEntity | void>;

  getMany: (i: GetManyInput) => Promise<Array<DocumentEntity>>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface CreatePartialInput {
  type: DocumentTypeEnum;
  documentNumber: string;
  fullName: string;
  birthDate: string;
}

export interface CreateCompleteInput {
  type: DocumentTypeEnum;
  documentNumber: string;
  fullName: string;
  birthDate: string;
  phone: string;
  address: DocumentAddress;
  documentPicture: Buffer;
  selfieWithDocument: Buffer;
}

export interface ReviewInput {
  accountId: string;
  approve: boolean;
  message?: string;
}

export interface DocumentUseCase {
  createPartial: (i: CreatePartialInput) => Promise<void>;

  createComplete: (i: CreateCompleteInput) => Promise<void>;

  getToReview: () => Promise<Array<DocumentEntity>>;

  review: (i: ReviewInput) => Promise<void>;
}
