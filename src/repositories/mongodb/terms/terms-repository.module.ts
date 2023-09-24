import { Module } from '@nestjs/common';
import { TermsRepositoryService } from './terms-repository.service';
import { MongoDBModule } from '..';

@Module({
  imports: [MongoDBModule.forFeature(['terms'])],
  providers: [TermsRepositoryService],
  exports: [TermsRepositoryService],
})
export class TermsRepositoryModule {}
