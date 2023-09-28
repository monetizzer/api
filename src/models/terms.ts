export interface TermsEntity {
  semVer: string;
  terms: string;
  liveAt?: Date;
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
  get: (i: GetInput) => Promise<TermsEntity | undefined>;

  getLatest: () => Promise<TermsEntity>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface LatestInput {
  semVer?: boolean;
}

export interface LatestOutput {
  semVer: string;
  terms?: string;
  liveAt?: Date;
}

export interface TermsUseCase {
  latest: (i: LatestInput) => Promise<LatestOutput>;
}
