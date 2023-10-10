import { DocumentStatusEnum } from 'src/types/enums/document-status';

export interface TokenPayload {
	sub: string; // accountId
	storeId?: string;
	dvs?: DocumentStatusEnum;
	admin?: boolean; //isAdmin
}

export interface UserData {
	accountId: string;
	storeId?: string;
	dvs: DocumentStatusEnum;
	isAdmin?: boolean;
}

export interface GenInput {
	accountId: string;
	storeId?: string;
	dvs?: DocumentStatusEnum;
	isAdmin: boolean;
}

export interface TokenAdapter {
	gen: (i: GenInput) => string;
}
