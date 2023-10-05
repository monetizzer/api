import { Module } from '@nestjs/common';
import { MongoDBModule } from './repositories/mongodb';
import { AccountModule } from './usecases/account/account.module';
import { TermsModule } from './usecases/terms/terms.module';
import { DocumentModule } from './usecases/document/document.module';
import { NotificationModule } from './usecases/notification/notification.module';
import { StoreModule } from './usecases/store/store.module';
import { ProductModule } from './usecases/product/product.module';
import { ContentModule } from './usecases/content/content.module';

@Module({
	imports: [
		MongoDBModule.forRoot(),
		AccountModule,
		TermsModule,
		DocumentModule,
		NotificationModule,
		StoreModule,
		ProductModule,
		ContentModule,
	],
})
export class AppModule {}
