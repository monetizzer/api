import { Module } from '@nestjs/common';
import { StoreRepositoryService } from './store-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Module({
	imports: [MongoDBModule.forFeature(['stores'])],
	providers: [StoreRepositoryService, UIDAdapter, UtilsAdapter],
	exports: [StoreRepositoryService],
})
export class StoreRepositoryModule {}
