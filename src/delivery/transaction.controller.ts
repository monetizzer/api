import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseFilePipe,
	Patch,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { TransactionService } from 'src/usecases/transaction/transaction.service';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import {
	GetPaymentProofImgDto,
	RequestWithdrawDto,
	WithdrawDto,
} from './dtos/transaction';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserData } from './decorators/user-data';
import { UserDataDto } from './dtos';
import { FileSizeValidationPipe } from './validators/files';

@Controller('wallet')
export class TransactionController {
	constructor(private readonly transactionService: TransactionService) {}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Post('/withdraw')
	@UseGuards(AuthGuard(['USER']))
	requestWithdraw(
		@Body()
		body: RequestWithdrawDto,
		@UserData()
		userData: UserDataDto,
	) {
		return this.transactionService.requestWithdraw({
			...body,
			accountId: userData.accountId,
		});
	}

	@Get('/')
	@UseGuards(AuthGuard(['USER']))
	wallet(
		@UserData()
		userData: UserDataDto,
	) {
		return this.transactionService.wallet({
			accountId: userData.accountId,
		});
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@Patch('/withdraw')
	@UseGuards(AdminGuard)
	@UseInterceptors(FileInterceptor('image'))
	withdraw(
		@Body()
		body: WithdrawDto,
		@UserData()
		userData: UserDataDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [new FileSizeValidationPipe({ maxSize: 10_000_000 })],
			}),
		)
		file: Express.Multer.File,
	) {
		return this.transactionService.withdraw({
			...body,
			image: file.buffer,
			authorId: userData.accountId,
		});
	}

	@Get('/payment-proof/:transactionIdAndExt')
	@UseGuards(AuthGuard(['USER']))
	getPaymentProofImg(
		@Param()
		params: GetPaymentProofImgDto,
		@UserData()
		userData: UserDataDto,
	) {
		const { transactionIdAndExt } = params;

		const [transactionId, ext] = transactionIdAndExt.split('.');

		return this.transactionService.getPaymentProofImg({
			accountId: userData.accountId,
			transactionId,
			ext,
			isAdmin: userData.isAdmin,
		});
	}
}
