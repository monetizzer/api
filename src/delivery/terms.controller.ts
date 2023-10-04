import { Controller, Get, Query } from '@nestjs/common';
import { TermsService } from 'src/usecases/terms/terms.service';
import { LatestDto } from './dtos/terms';

@Controller('terms')
export class TermsController {
	constructor(private readonly termsService: TermsService) {}

	@Get('/latest')
	latest(
		@Query()
		params: LatestDto,
	) {
		return this.termsService.latest(params);
	}
}
