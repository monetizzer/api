import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from '../../delivery/product.controller';
import { ProductRepositoryModule } from 'src/repositories/mongodb/product/product-repository.module';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { NotificationModule } from '../notification/notification.module';
import { ContentRepositoryModule } from 'src/repositories/mongodb/content/content-repository.module';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { SaleRepositoryModule } from 'src/repositories/mongodb/sale/sale-repository.module';

@Module({
	controllers: [ProductController],
	imports: [
		ProductRepositoryModule,
		StoreRepositoryModule,
		ContentRepositoryModule,
		SaleRepositoryModule,
		NotificationModule,
	],
	providers: [ProductService, S3Adapter, UIDAdapter, UtilsAdapter],
})
export class ProductModule {}
