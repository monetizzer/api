import {
	IsArray,
	IsDateString,
	IsEnum,
	IsInt,
	IsString,
	ValidateNested,
} from 'class-validator';
import { IsID } from '../validators/internal';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';
import { Transform } from 'class-transformer';

export class CheckoutDto {
	@IsID()
	productId: string;

	@IsString()
	@IsEnum(PaymentMethodEnum)
	paymentMethod: PaymentMethodEnum;
}

export class GetDto {
	@IsID()
	saleId: string;
}

class PixWebhookItem {
	@IsString()
	endToEndId: string; // Pix ID

	@IsString()
	txid: string; // Sale ID

	@IsString()
	chave: string; // Pix Key

	@IsInt()
	@Transform(({ value }) => parseInt(value.replace('.', ''), 10))
	valor: number; // Value

	@IsDateString()
	horario: string; // ISO Date

	@IsString()
	infoPagador: string; // Message
}

export class ProcessPixWebhookDto {
	@IsArray()
	@ValidateNested({ each: true })
	pix: Array<PixWebhookItem>;
}
