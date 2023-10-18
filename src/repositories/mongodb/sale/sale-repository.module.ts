import { Module } from '@nestjs/common';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { SaleRepositoryService } from './sale-repository.service';
import { DateAdapter } from 'src/adapters/implementations/date.service';

@Module({
	imports: [MongoDBModule.forFeature(['sales'])],
	providers: [SaleRepositoryService, UIDAdapter, UtilsAdapter, DateAdapter],
	exports: [SaleRepositoryService],
})
export class SaleRepositoryModule {}
