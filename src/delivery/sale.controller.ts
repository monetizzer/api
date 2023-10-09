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
import { AccountId } from './decorators/account-id';
import {
	CheckoutDto,
	ClientSalesDto,
	GetDto,
	ProcessPixWebhookDto,
	StoreSalesDto,
} from './dtos/sale';
import { IsAdmin } from './decorators/is-admin';
import { AuthGuard } from './guards/auth.guard';

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
		@AccountId()
		clientId: string,
	) {
		return this.saleService.checkout({
			...body,
			clientId,
		});
	}

	@Get('/:saleId')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	get(
		@IsAdmin()
		isAdmin: boolean,
		@AccountId()
		accountId: string,
		@Param()
		params: GetDto,
	) {
		return this.saleService.get({
			...params,
			isAdmin,
			accountId,
		});
	}

	@Get('client')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	clientSales(
		@Query()
		query: ClientSalesDto,
		@AccountId()
		accountId: string,
	) {
		return this.saleService.clientSales({
			...query,
			accountId,
		});
	}

	@Get('store')
	@UseGuards(AuthGuard(['USER', 'BOT']))
	storeSales(
		@Query()
		query: StoreSalesDto,
		@AccountId()
		accountId: string,
	) {
		return this.saleService.storeSales({
			...query,
			accountId,
		});
	}
}
