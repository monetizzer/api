import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from '../../delivery/product.controller';
import { ProductRepositoryModule } from 'src/repositories/mongodb/product/product-repository.module';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';

@Module({
	controllers: [ProductController],
	imports: [ProductRepositoryModule, StoreRepositoryModule],
	providers: [ProductService, S3Adapter, UIDAdapter],
})
export class ProductModule {}
