import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import { GetInput, TermsEntity, TermsRepository } from 'src/models/terms';
import { SemVerAdapter } from 'src/adapters/implementations/semver.service';

interface TermsTable extends Omit<TermsEntity, 'semVer'> {
  _id: string;
}

@Injectable()
export class TermsRepositoryService implements TermsRepository {
  constructor(
    @InjectRepository('terms')
    private readonly termsRepository: Repository<TermsTable>,
    private readonly versionAdapter: SemVerAdapter,
  ) {}

  async get({ semVer }: GetInput): Promise<void | TermsEntity> {
    const terms = await this.termsRepository.findOne({
      _id: semVer,
    });

    if (!terms) return;

    const { _id, ...termsData } = terms;

    return {
      ...termsData,
      semVer: _id,
    };
  }

  async getLatest(): Promise<TermsEntity> {
    const termsCursor = await this.termsRepository.find(
      {
        live: true,
      },
      {
        limit: 10,
        sort: {
          createdAt: 'desc',
        },
      },
    );
    const terms = await termsCursor.toArray();

    if (terms.length <= 0) return;

    const versions = terms.map((t) => t._id);

    const latestSemVer = this.versionAdapter.latest({ versions });

    const latestTerms = terms.find((t) => t._id === latestSemVer);

    if (!latestTerms) return;

    const { _id, ...termsData } = latestTerms;

    return {
      ...termsData,
      semVer: _id,
    };
  }
}
