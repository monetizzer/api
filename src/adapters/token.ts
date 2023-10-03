export interface TokenPayload {
	sub: string; // accountId
	admin?: boolean; //isAdmin
}

export interface GenInput {
	accountId: string;
	isAdmin: boolean;
}

export interface TokenAdapter {
	gen: (i: GenInput) => string;
}
