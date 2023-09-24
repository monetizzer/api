import { Module } from '@nestjs/common';
import { AccountRepositoryService } from './account-repository.service';
import { MongoDBModule } from '..';

@Module({
  imports: [MongoDBModule.forFeature(['accounts'])],
  providers: [AccountRepositoryService],
  exports: [AccountRepositoryService],
})
export class AccountRepositoryModule {}
