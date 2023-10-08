import { MediaTypeEnum } from 'src/types/enums/media-type';
import { IsFileName, IsID } from '../validators/internal';

export class WithdrawDto {
	@IsID()
	transactionId: string;
}

export class GetPaymentProofImgDto {
	@IsFileName([MediaTypeEnum.IMAGE])
	transactionIdAndExt: string;
}
