import { Readable } from 'node:stream';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';
import { PaymentProviderEnum } from 'src/types/enums/payment-provider';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';

interface TransactionHistoryItem {
	timestamp: Date;
	status: TransactionStatusEnum;
	authorId: string | 'SYSTEM';
	message?: string;
}

interface BaseTransactionEntity {
	transactionId: string;
	accountId: string;
	type: TransactionTypeEnum;
	status: TransactionStatusEnum;
	amount: number;
	history: Array<TransactionHistoryItem>;
	createdAt: Date;
}

export interface TransactionIncomeEntity extends BaseTransactionEntity {
	type: TransactionTypeEnum.INCOME;
	paymentMethod: PaymentMethodEnum;
	provider: PaymentProviderEnum;
	pixCode: string;
	pixExpiresAt: Date;
	saleId: string;
	saleDeliveredAt?: Date;
	paymentId?: string;
	paidAt?: Date;
	refundedAt?: Date;
}

export interface TransactionWithdrawEntity extends BaseTransactionEntity {
	type: TransactionTypeEnum.WITHDRAW;
	bankAccount: string;
	proofOfPaymentUrl?: string;
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface CreateIncomeInput {
	accountId: string;
	amount: number;
	saleId: string;
	pixCode: string;
	pixExpiresAt: Date;
	paymentMethod: PaymentMethodEnum;
	provider: PaymentProviderEnum;
}

export interface CreateWithdrawInput {
	accountId: string;
	amount: number;
	bankAccount: string;
}

export interface CreateOutput {
	transactionId: string;
}

export type CompleteIncomeInput =
	| {
			transactionId: string;
			status: TransactionStatusEnum.FAILED;
			message: string;
			authorId: string;
	  }
	| {
			transactionId: string;
			status: TransactionStatusEnum.COMPLETED;
			paymentId: string;
			setSaleAsDelivered?: true; // Only for pre made products!
	  };

export type CompleteWithdrawInput =
	| {
			transactionId: string;
			status: TransactionStatusEnum.FAILED;
			message: string;
			authorId: string;
	  }
	| {
			transactionId: string;
			status: TransactionStatusEnum.COMPLETED;
			proofOfPaymentUrl: string;
			authorId: string;
	  };

export interface GetManyBySaleIdInput {
	saleId: string;
}

export interface GetByTransactionIdInput {
	transactionId: string;
}

export interface GetBalanceInput {
	accountId: string;
}

export interface GetManyWithdrawInput {
	accountId?: string;
	status?: Array<TransactionStatusEnum>;
}

export interface RequestRefundInput {
	authorId: string;
	saleId: string;
}

export interface CompleteRefundInput {
	saleId: string;
	status:
		| TransactionStatusEnum.REFUND_COMPLETED
		| TransactionStatusEnum.REFUND_FAILED;
	message?: string;
}

export interface SetSaleAsDeliveredInput {
	saleId: string;
}

export abstract class TransactionIncomeRepository {
	abstract create(i: CreateIncomeInput): Promise<CreateOutput>;

	abstract complete(i: CompleteIncomeInput): Promise<void>;

	abstract getManyBySaleId(
		i: GetManyBySaleIdInput,
	): Promise<Array<TransactionIncomeEntity>>;

	// Get all the INCOMING value in the account that the user can withdraw
	// ALERT: It doesn't consider previous withdraws!
	abstract getTotalAvailable(i: GetBalanceInput): Promise<number>;

	// Get all the INCOMING value in the account
	// ALERT: It doesn't consider previous withdraws!
	abstract getTotal(i: GetBalanceInput): Promise<number>;

	abstract requestRefund(
		i: RequestRefundInput,
	): Promise<Array<TransactionIncomeEntity>>;

	abstract completeRefund(i: CompleteRefundInput): Promise<void>;

	abstract setSaleAsDelivered(i: SetSaleAsDeliveredInput): Promise<void>;
}

export abstract class TransactionWithdrawRepository {
	abstract create(i: CreateWithdrawInput): Promise<CreateOutput>;

	abstract complete(i: CompleteWithdrawInput): Promise<void>;

	abstract getByTransactionId(
		i: GetByTransactionIdInput,
	): Promise<TransactionWithdrawEntity | undefined>;

	// Get all the OUTGOING value in the account
	// ALERT: It also consider pending withdraws!
	abstract getTotal(i: GetBalanceInput): Promise<number>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface WalletInput {
	accountId: string;
}

export interface WalletOutput {
	balance: number;
	pending: number;
	totalRevenue: number;
	totalWithdrawn: number;
}

export interface RequestWithdrawInput {
	accountId: string;
	bankAccount: string;
	amount: number;
}

export interface WithdrawInput {
	authorId: string;
	transactionId: string;
	image: Buffer;
}

export interface GetPaymentProofImgInput {
	accountId: string;
	transactionId: string;
	ext: string;
	isAdmin: boolean;
}

export interface BalanceInput {
	accountId: string;
}

export abstract class TransactionUseCase {
	abstract wallet(i: WalletInput): Promise<WalletOutput>;

	abstract requestWithdraw(i: RequestWithdrawInput): Promise<void>;

	abstract withdraw(i: WithdrawInput): Promise<void>;

	abstract getPaymentProofImg(i: GetPaymentProofImgInput): Promise<Readable>;

	// Get the total available to withdraw
	protected abstract balance(i: BalanceInput): Promise<number>;
}
