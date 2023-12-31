import { Readable } from 'stream';
import { DocumentTypeEnum } from 'src/types/enums/document-type';
import { DocumentStatusEnum } from 'src/types/enums/document-status';
import { Paginated, PaginatedItems } from 'src/types/paginated-items';

interface DocumentHistoryItem {
	timestamp: Date;
	status: DocumentStatusEnum;
	authorId: string | 'SYSTEM';
	type?: DocumentTypeEnum;
	documentNumber?: string;
	message?: string;
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
	authorId: string;
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
	documentPictureUrl: string;
	selfieWithDocumentUrl: string;
}

export interface GetByAccountIdInput {
	accountId: string;
}

export interface GetManyInput {
	type?: DocumentTypeEnum;
	documentNumber?: string;
	status?: Array<DocumentStatusEnum>;
	limit?: number;
	offset?: number;
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

	getByAccountId: (
		i: GetByAccountIdInput,
	) => Promise<DocumentEntity | undefined>;

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
	accountId: string;
	type: DocumentTypeEnum;
	documentNumber: string;
	fullName: string;
	birthDate: string;
	phone: string;
	address: DocumentAddress;
	documentPicture: Buffer;
	selfieWithDocument: Buffer;
}

export interface GetOwnDocumentInput {
	accountId: string;
}

export type GetToReviewInput = Paginated;

export interface ReviewInput {
	accountId: string;
	authorId: string;
	approve: boolean;
	message?: string;
}

export interface GetImageInput {
	accountId: string;
	name: string;
}

export interface DocumentUseCase {
	// createPartial: (i: CreatePartialInput) => Promise<void>;

	createComplete: (i: CreateCompleteInput) => Promise<void>;

	getOwnDocument: (i: GetOwnDocumentInput) => Promise<DocumentEntity>;

	getToReview: (i: GetToReviewInput) => Promise<PaginatedItems<DocumentEntity>>;

	review: (i: ReviewInput) => Promise<void>;

	getImage: (i: GetImageInput) => Promise<Readable>;
}
