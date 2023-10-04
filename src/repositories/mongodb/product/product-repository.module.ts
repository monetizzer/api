import { Module } from '@nestjs/common';
import { ProductRepositoryService } from './product-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';

@Module({
	imports: [MongoDBModule.forFeature(['products'])],
	providers: [ProductRepositoryService, UIDAdapter],
	exports: [ProductRepositoryService],
})
export class ProductRepositoryModule {}
