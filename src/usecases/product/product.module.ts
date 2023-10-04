import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from '../../delivery/product.controller';
import { ProductRepositoryModule } from 'src/repositories/mongodb/product/product-repository.module';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
	controllers: [ProductController],
	imports: [ProductRepositoryModule, StoreRepositoryModule, NotificationModule],
	providers: [ProductService, S3Adapter, UIDAdapter, DiscordJSAdapter],
})
export class ProductModule {}
