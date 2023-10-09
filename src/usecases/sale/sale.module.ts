import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from '../../delivery/sale.controller';
import { SaleRepositoryModule } from 'src/repositories/mongodb/sale/sale-repository.module';
import { TransactionRepositoryModule } from 'src/repositories/mongodb/transaction/transaction-repository.module';
import { ProductRepositoryModule } from 'src/repositories/mongodb/product/product-repository.module';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { GerencianetAdapter } from 'src/adapters/implementations/gerencianet.service';
import { NotificationModule } from '../notification/notification.module';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';

@Module({
	controllers: [SaleController],
	imports: [
		SaleRepositoryModule,
		TransactionRepositoryModule,
		ProductRepositoryModule,
		StoreRepositoryModule,
		NotificationModule,
	],
	providers: [SaleService, GerencianetAdapter, UtilsAdapter],
})
export class SaleModule {}
