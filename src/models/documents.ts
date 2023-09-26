import { DocumentTypeEnum } from 'src/types/enums/document-type';
import { DocumentValidationStatus } from 'src/types/enums/document-validation-status';

interface DocumentHistoryItem {
  timestamp: Date;
  status: DocumentValidationStatus;
  type: DocumentTypeEnum;
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
  status: DocumentValidationStatus;
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

export interface UpsertPartialInput {
  accountId: string;
  type: DocumentTypeEnum;
  documentNumber: string;
  fullName: string;
  birthDate: string;
}

export interface IsApprovedInput {
  type: DocumentTypeEnum;
  documentNumber: string;
}

export interface ApprovePartialInput {
  accountId: string;
}

export interface UpdateStatusInput {
  accountId: string;
  status: DocumentValidationStatus;
  message?: string;
  reviewerId?: string;
}

export interface UpsertCompleteInput {
  accountId: string;
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
  status?: Array<DocumentValidationStatus>;
}

export interface DocumentRepository {
  upsertPartial: (i: UpsertPartialInput) => Promise<void>;

  // Checks if we already have an COMPLETE document with that same
  // number and type that is approved
  isApproved: (i: IsApprovedInput) => Promise<boolean>;

  updateStatus: (i: UpdateStatusInput) => Promise<void>;

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

export interface DocumentUseCase {
  createPartial: (i: any) => Promise<void>;

  createComplete: (i: any) => Promise<void>;

  getToReview: (i: any) => Promise<void>;

  review: (i: any) => Promise<void>;
}
