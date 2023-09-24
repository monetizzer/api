export interface MagicLinkCodeEntity {
  accountId: string;
  code: boolean;
  createdAt: Date;
}

/**
 *
 *
 * Repository
 *
 *
 */

export type UpsertInput = {
  accountId: string;
  code: string;
};

export interface GetInput {
  accountId: string;
  code: string;
}

export interface MagicLinkCodeRepository {
  upsert: (i: UpsertInput) => Promise<MagicLinkCodeEntity>;

  get: (i: GetInput) => Promise<MagicLinkCodeEntity | void>;
}
