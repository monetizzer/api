import { Module } from '@nestjs/common';
import { MongoDBModule } from './repositories/mongodb';
import { AccountModule } from './usecases/account/account.module';
import { TermsModule } from './usecases/terms/terms.module';
import { DocumentModule } from './usecases/document/document.module';
import { NotificationModule } from './usecases/notification/notification.module';
import { StoreModule } from './usecases/store/store.module';

@Module({
	imports: [
		MongoDBModule.forRoot(),
		AccountModule,
		TermsModule,
		DocumentModule,
		NotificationModule,
		StoreModule,
	],
})
export class AppModule {}
