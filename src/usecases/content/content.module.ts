import { Module } from '@nestjs/common';
import { ContentController } from '../../delivery/content.controller';
import { ContentService } from './content.service';
import { ContentRepositoryModule } from 'src/repositories/mongodb/content/content-repository.module';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { ProductRepositoryModule } from 'src/repositories/mongodb/product/product-repository.module';
import { SaleRepositoryModule } from 'src/repositories/mongodb/sale/sale-repository.module';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Module({
	controllers: [ContentController],
	imports: [
		ContentRepositoryModule,
		StoreRepositoryModule,
		ProductRepositoryModule,
		SaleRepositoryModule,
	],
	providers: [ContentService, S3Adapter, UIDAdapter, UtilsAdapter],
})
export class ContentModule {}
