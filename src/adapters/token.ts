export interface TokenPayload {
	sub: string; // accountId
	isAdmin: boolean;
}

export interface GenInput {
	accountId: string;
	isAdmin: boolean;
}

export interface TokenAdapter {
	gen: (i: GenInput) => string;
}
