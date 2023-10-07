import { Module } from '@nestjs/common';
import { TransactionController } from '../../delivery/transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionRepositoryModule } from 'src/repositories/mongodb/transaction/transaction-repository.module';

@Module({
	controllers: [TransactionController],
	imports: [TransactionRepositoryModule],
	providers: [TransactionService],
})
export class TransactionModule {}
