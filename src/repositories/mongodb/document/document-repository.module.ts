import { Module } from '@nestjs/common';
import { DocumentRepositoryService } from './document-repository.service';
import { MongoDBModule } from '..';

@Module({
	imports: [MongoDBModule.forFeature(['documents'])],
	providers: [DocumentRepositoryService],
	exports: [DocumentRepositoryService],
})
export class DocumentRepositoryModule {}
