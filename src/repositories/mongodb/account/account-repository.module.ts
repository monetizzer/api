import { Module } from '@nestjs/common';
import { AccountRepositoryService } from './account-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';

@Module({
  imports: [MongoDBModule.forFeature(['accounts'])],
  providers: [AccountRepositoryService, UIDAdapter],
  exports: [AccountRepositoryService],
})
export class AccountRepositoryModule {}
