import { Module } from '@nestjs/common';
import { TransactionController } from '../../delivery/transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionRepositoryModule } from 'src/repositories/mongodb/transaction/transaction-repository.module';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
	controllers: [TransactionController],
	imports: [TransactionRepositoryModule, NotificationModule],
	providers: [TransactionService, S3Adapter, UtilsAdapter],
})
export class TransactionModule {}
