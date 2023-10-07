import { IsEnum, IsString } from 'class-validator';
import { IsID } from '../validators/internal';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';

export class CheckoutDto {
	@IsID()
	productId: string;

	@IsString()
	@IsEnum(PaymentMethodEnum)
	paymentMethod: PaymentMethodEnum;
}
