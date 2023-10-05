import { Module } from '@nestjs/common';
import { ContentRepositoryService } from './content-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Module({
	imports: [MongoDBModule.forFeature(['contents'])],
	providers: [ContentRepositoryService, UIDAdapter, UtilsAdapter],
	exports: [ContentRepositoryService],
})
export class ContentRepositoryModule {}
