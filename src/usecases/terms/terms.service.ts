import { Inject, Injectable } from '@nestjs/common';
import { LatestInput, LatestOutput, TermsUseCase } from 'src/models/terms';
import { TermsRepositoryService } from 'src/repositories/mongodb/terms/terms-repository.service';

@Injectable()
export class TermsService implements TermsUseCase {
	constructor(
		@Inject(TermsRepositoryService)
		private readonly termsRepository: TermsRepositoryService,
	) {}

	async latest({ semVer }: LatestInput): Promise<LatestOutput> {
		const terms = await this.termsRepository.getLatest();

		if (semVer) {
			return {
				semVer: terms.semVer,
			};
		}

		return {
			semVer: terms.semVer,
			terms: terms.terms,
			liveAt: terms.liveAt,
		};
	}
}
