import { Module } from '@nestjs/common';
import { WithdrawRepositoryService } from './withdraw-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { IncomeRepositoryService } from './income-repository.service';
import { DateAdapter } from 'src/adapters/implementations/date.service';

@Module({
	imports: [MongoDBModule.forFeature(['transactions'])],
	providers: [
		IncomeRepositoryService,
		WithdrawRepositoryService,
		UIDAdapter,
		DateAdapter,
	],
	exports: [IncomeRepositoryService, WithdrawRepositoryService],
})
export class TransactionRepositoryModule {}
