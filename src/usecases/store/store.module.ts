import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { StoreController } from '../../delivery/store.controller';
import { DocumentRepositoryModule } from 'src/repositories/mongodb/document/document-repository.module';
import { AccountRepositoryModule } from 'src/repositories/mongodb/account/account-repository.module';
import { S3Adapter } from 'src/adapters/implementations/s3.service';

@Module({
	controllers: [StoreController],
	imports: [
		StoreRepositoryModule,
		DocumentRepositoryModule,
		AccountRepositoryModule,
	],
	providers: [StoreService, S3Adapter],
})
export class StoreModule {}
