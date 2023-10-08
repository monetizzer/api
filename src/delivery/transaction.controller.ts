import {
	Body,
	Controller,
	Get,
	MaxFileSizeValidator,
	ParseFilePipe,
	Patch,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { TransactionService } from 'src/usecases/transaction/transaction.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { WithdrawDto } from './dtos/transaction';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('wallet')
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@Get('/')
	@UseGuards(AuthGuard(['USER']))
	wallet(
		@AccountId()
		accountId: string,
	) {
		return this.transactionService.wallet({
			accountId,
		});
	}

	@Patch('/withdraw')
	@UseGuards(AdminGuard)
	@UseInterceptors(FileInterceptor('image'))
	withdraw(
		@Body()
		body: WithdrawDto,
		@AccountId()
		reviewerId: string,
		@UploadedFile(
			new ParseFilePipe({
				validators: [new MaxFileSizeValidator({ maxSize: 10_000_000 })],
			}),
		)
		file: Express.Multer.File,
	) {
		return this.transactionService.withdraw({
			...body,
			image: file.buffer,
			reviewerId,
		});
	}
}
