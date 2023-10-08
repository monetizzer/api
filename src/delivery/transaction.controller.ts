import {
	Body,
	Controller,
	Get,
	MaxFileSizeValidator,
	Param,
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
import { GetPaymentProofImgDto, WithdrawDto } from './dtos/transaction';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsAdmin } from './decorators/is-admin';

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

	@Get('/payment-proof/:transactionIdAndExt')
	@UseGuards(AuthGuard(['USER']))
	getPaymentProofImg(
		@Param()
		params: GetPaymentProofImgDto,
		@AccountId()
		accountId: string,
		@IsAdmin()
		isAdmin: boolean,
	) {
		const { transactionIdAndExt } = params;

		const [transactionId, ext] = transactionIdAndExt.split('.');

		return this.transactionService.getPaymentProofImg({
			accountId,
			transactionId,
			ext,
			isAdmin,
		});
	}
}
