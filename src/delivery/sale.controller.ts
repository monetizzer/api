import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { SaleService } from 'src/usecases/sale/sale.service';
import {
	CheckoutDto,
	ClientSalesDto,
	GetDto,
	ProcessPixWebhookDto,
	StoreSalesDto,
} from './dtos/sale';
import { AuthGuard } from './guards/auth.guard';
import { UserData } from './decorators/user-data';
import { UserDataDto } from './dtos';

@Controller('sales')
export class SaleController {
	constructor(private readonly saleService: SaleService) {}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('/webhooks/pix')
	processPixWebhook(
		@Body()
		body: ProcessPixWebhookDto,
	) {
		const [pix] = body.pix;

		return this.saleService.processPixWebhook({
			saleId: pix.txid,
			paymentId: pix.endToEndId,
			amount: pix.valor,
		});
	}

	@Post('/checkout')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	checkout(
		@Body()
		body: CheckoutDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.saleService.checkout({
			...body,
			clientId: userData.accountId,
			storeId: userData.storeId,
		});
	}

	@Get('/:saleId')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	get(
		@UserData()
		userData: UserDataDto,
		@Param()
		params: GetDto,
	) {
		return this.saleService.get({
			...params,
			isAdmin: userData.isAdmin,
			accountId: userData.accountId,
		});
	}

	@Get('client')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	clientSales(
		@Query()
		query: ClientSalesDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.saleService.clientSales({
			...query,
			accountId: userData.accountId,
		});
	}

	@Get('store')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	storeSales(
		@Query()
		query: StoreSalesDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.saleService.storeSales({
			...query,
			storeId: userData.storeId,
		});
	}
}
