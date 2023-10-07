import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SaleService } from 'src/usecases/sale/sale.service';
import { AccountId } from './decorators/account-id';
import { CheckoutDto, GetDto, ProcessPixWebhookDto } from './dtos/sale';
import { IsAdmin } from './decorators/is-admin';
import { AuthGuard } from './guards/auth.guard';

@Controller('sales')
export class SaleController {
	constructor(private readonly saleService: SaleService) {}

	@Post('/checkout')
	@UseGuards(AuthGuard(['USER']))
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
	@UseGuards(AuthGuard(['USER']))
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
}
