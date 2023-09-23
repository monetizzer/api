export type AuthType = 'BOT' | 'USER';

export interface JWTPayload {
  accountId: string;
  admin?: boolean;
}
