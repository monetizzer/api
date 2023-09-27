import { Module } from '@nestjs/common';
import { StoreRepositoryService } from './store-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';

@Module({
  imports: [MongoDBModule.forFeature(['stores'])],
  providers: [StoreRepositoryService, UIDAdapter],
  exports: [StoreRepositoryService],
})
export class StoreRepositoryModule {}
