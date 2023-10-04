import { Module } from '@nestjs/common';
import { ProductRepositoryService } from './product-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Module({
	imports: [MongoDBModule.forFeature(['products'])],
	providers: [ProductRepositoryService, UIDAdapter, UtilsAdapter],
	exports: [ProductRepositoryService],
})
export class ProductRepositoryModule {}
