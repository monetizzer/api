import { Body, Controller, Post } from '@nestjs/common';
import { SaleService } from 'src/usecases/sale/sale.service';
import { AccountId } from './decorators/account-id';
import { CheckoutDto } from './dtos/sale';

@Controller('sales')
export class SaleController {
	constructor(private readonly saleService: SaleService) {}

	@Post('/checkout')
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
}
