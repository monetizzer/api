import { PaymentMethodEnum } from 'src/types/enums/payment-method';
import { SalesStatusEnum } from 'src/types/enums/sale-status';
import { ProductEntity } from './product';
import { StoreEntity } from './store';
import { Paginated, PaginatedItems } from 'src/types/paginated-items';

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

export interface GetManyInput {
	clientId?: string;
	storeId?: string;
	productId?: string;
	status?: Array<SalesStatusEnum>;
	limit?: number;
	offset?: number;
}

export interface SaleRepository {
	create: (i: CreateInput) => Promise<CreateOutput>;

	getBySaleId: (i: GetBySaleIdInput) => Promise<SaleEntity | undefined>;

	getMany: (i: GetManyInput) => Promise<Array<SaleEntity>>;

	hasBoughtPreMadeProduct: (
		i: HasBoughtPreMadeProductInput,
	) => Promise<boolean>;

	updateStatus: (i: UpdateStatusInput) => Promise<void>;

	// Update the status of all expired sales to EXPIRED
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
	saleId: string;
	paymentId: string;
	amount: number;

	// Webhook message received (formatted on the controller):
	// ----
	// pix: Array<{
	// 	endToEndId: string; // Pix ID
	// 	txid: string; // Sale ID
	// 	chave: string; // Pix Key
	// 	valor: string; // Amount
	// 	horario: string; // ISO Date
	// 	infoPagador: string; // Message
	// }>;
	// ----
}

export interface CheckoutInput {
	clientId: string;
	storeId?: string;
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

export interface GetOutput extends SaleEntity {
	product: ProductEntity;
	store: StoreEntity;
}

export interface ClientSalesInput extends Paginated {
	accountId: string;
	storeId?: string;
	status?: SalesStatusEnum;
}

export interface StoreSalesInput extends Paginated {
	storeId?: string;
	clientId?: string;
	productId?: string;
	status?: SalesStatusEnum;
}

export interface SaleUseCase {
	processPixWebhook: (i: ProcessPixWebhookInput) => Promise<void>;

	checkout: (i: CheckoutInput) => Promise<CheckoutOutput>;

	get: (i: GetInput) => Promise<GetOutput>;

	// Update the status of all expired sales to EXPIRED
	updateExpired: () => Promise<void>;

	clientSales: (i: ClientSalesInput) => Promise<PaginatedItems<SaleEntity>>;

	storeSales: (i: StoreSalesInput) => Promise<PaginatedItems<SaleEntity>>;
}
