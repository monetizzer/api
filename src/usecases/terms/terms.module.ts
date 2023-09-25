import { Module } from '@nestjs/common';
import { TermsService } from './terms.service';
import { TermsController } from '../../delivery/terms.controller';
import { TermsRepositoryModule } from 'src/repositories/mongodb/terms/terms-repository.module';

@Module({
  imports: [TermsRepositoryModule],
  controllers: [TermsController],
  providers: [TermsService],
})
export class TermsModule {}
