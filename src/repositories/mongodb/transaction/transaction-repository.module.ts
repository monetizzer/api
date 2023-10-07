import { Module } from '@nestjs/common';
import { TransactionRepositoryService } from './transaction-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';

@Module({
	imports: [MongoDBModule.forFeature(['transactions'])],
	providers: [TransactionRepositoryService, UIDAdapter],
	exports: [TransactionRepositoryService],
})
export class TransactionRepositoryModule {}
