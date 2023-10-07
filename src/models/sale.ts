import { PaymentMethodEnum } from 'src/types/enums/payment-method';
import { SalesStatusEnum } from 'src/types/enums/sale-status';

interface SaleHistoryItem {
	timestamp: Date;
	status: SalesStatusEnum;
}

export interface SaleEntity {
	saleId: string;
	clientId: string;
	storeId: string;
	productId: string;
	status: SalesStatusEnum;
	value: number; // https://app.clickup.com/30989429/v/dc/xhq3n-260/xhq3n-300?block=block-e3d85059-bfed-4f13-9a1a-8d477206ca59
	paymentMethod: PaymentMethodEnum;
	history: Array<SaleHistoryItem>;
	createdAt: Date;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface CreateInput {
	clientId: string;
	storeId: string;
	productId: string;
	value: number;
	paymentMethod: PaymentMethodEnum;
}

export interface CreateOutput {
	saleId: string;
}

export interface GetBySaleIdInput {
	saleId: string;
}

export interface HasBoughtPreMadeProductInput {
	clientId: string;
	productId: string;
}

export interface UpdateStatusInput {
	saleId: string;
	status: SalesStatusEnum;
}

export interface SaleRepository {
	create: (i: CreateInput) => Promise<CreateOutput>;

	getBySaleId: (i: GetBySaleIdInput) => Promise<SaleEntity | undefined>;

	hasBoughtPreMadeProduct: (
		i: HasBoughtPreMadeProductInput,
	) => Promise<boolean>;

	updateStatus: (i: UpdateStatusInput) => Promise<void>;

	// Update the status of all sales that are expired to EXPIRED
	updateExpired: () => Promise<void>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface ProcessPixWebhookInput {
	pix: Array<{
		endToEndId: string; // Pix ID
		txid: string; // Sale ID
		chave: string; // Pix Key
		valor: string; // Value
		horario: string; // ISO Date
		infoPagador: string; // Message
	}>;
}

export interface CheckoutInput {
	clientId: string;
	productId: string;
	paymentMethod: PaymentMethodEnum;
}

export interface CheckoutOutput {
	pix: {
		code: string;
		qrCodeBase64: string;
	};
}

export interface GetInput {
	isAdmin: boolean;
	accountId: string;
	saleId: string;
}

export interface SaleUseCase {
	processPixWebhook: (i: ProcessPixWebhookInput) => Promise<void>;

	checkout: (i: CheckoutInput) => Promise<CheckoutOutput>;

	get: (i: GetInput) => Promise<SaleEntity>;
}
