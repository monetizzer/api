import { MediaTypeEnum } from 'src/types/enums/media-type';
import { IsFileName, IsID } from '../validators/internal';
import { IsInt, IsString } from 'class-validator';

export class RequestWithdrawDto {
	@IsID()
	transactionId: string;

	@IsInt()
	amount: number;

	@IsString()
	bankAccount: string;
}

export class WithdrawDto {
	@IsID()
	transactionId: string;
}

export class GetPaymentProofImgDto {
	@IsFileName([MediaTypeEnum.IMAGE])
	transactionIdAndExt: string;
}
