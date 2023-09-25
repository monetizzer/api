import { Module } from '@nestjs/common';
import { TermsRepositoryService } from './terms-repository.service';
import { MongoDBModule } from '..';
import { SemVerAdapter } from 'src/adapters/implementations/semver.service';

@Module({
  imports: [MongoDBModule.forFeature(['terms'])],
  providers: [TermsRepositoryService, SemVerAdapter],
  exports: [TermsRepositoryService],
})
export class TermsRepositoryModule {}
