import { IsID } from '../validators/internal';

export class WithdrawDto {
	@IsID()
	transactionId: string;
}
