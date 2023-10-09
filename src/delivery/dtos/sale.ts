import {
	IsArray,
	IsDateString,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { IsID } from '../validators/internal';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';
import { Transform } from 'class-transformer';
import { SalesStatusEnum } from 'src/types/enums/sale-status';
import { PaginatedDto } from '.';

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

export class ClientSalesDto extends PaginatedDto {
	@IsOptional()
	@IsID()
	storeId?: string;

	@IsOptional()
	@IsString()
	@IsEnum(SalesStatusEnum)
	status?: SalesStatusEnum;
}

export class StoreSalesDto extends PaginatedDto {
	@IsOptional()
	@IsID()
	clientId?: string;

	@IsOptional()
	@IsID()
	productId?: string;

	@IsOptional()
	@IsString()
	@IsEnum(SalesStatusEnum)
	status?: SalesStatusEnum;
}
