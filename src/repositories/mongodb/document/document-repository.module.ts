import { Module } from '@nestjs/common';
import { DocumentRepositoryService } from './document-repository.service';
import { MongoDBModule } from '..';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Module({
	imports: [MongoDBModule.forFeature(['documents'])],
	providers: [DocumentRepositoryService, UtilsAdapter],
	exports: [DocumentRepositoryService],
})
export class DocumentRepositoryModule {}
