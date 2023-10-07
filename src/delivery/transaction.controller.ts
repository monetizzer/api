import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { TransactionService } from 'src/usecases/transaction/transaction.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';

@Controller('wallet')
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@Get('/')
	@UseInterceptors(AuthGuard(['USER']))
	wallet(
		@AccountId()
		accountId: string,
	) {
		return this.transactionService.wallet({
			accountId,
		});
	}
}
