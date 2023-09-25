import { Controller, Get, Param } from '@nestjs/common';
import { TermsService } from 'src/usecases/terms/terms.service';
import { LatestDto } from './dtos/terms';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get('/latest')
  latest(
    @Param()
    params: LatestDto,
  ) {
    return this.termsService.latest(params);
  }
}
