export interface GenPixInput {
	saleId: string;
	value: number;
	expirationInMinutes: number;
}

export interface GenPixOutput {
	code: string;
	qrCodeBase64: string;
}

export interface RefundInput {
	saleId: string;
}

export interface PaymentAdapter {
	genPix: (i: GenPixInput) => Promise<GenPixOutput>;

	refund: (i: RefundInput) => Promise<void>;
}
