export interface TokenPayload {
  sub: string; // accountId
}

export interface GenInput {
  accountId: string;
}

export interface TokenAdapter {
  gen: (i: GenInput) => string;
}
