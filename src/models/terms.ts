export interface TermsEntity {
  semVer: string;
  terms: string;
  live: boolean;
  createdAt: Date;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface GetInput {
  semVer: string;
}

export interface TermsRepository {
  get: (i: GetInput) => Promise<TermsEntity | void>;

  getLatest: () => Promise<TermsEntity>;
}
