import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';

export interface TransactionEntity {
	transactionId: string;
	accountId: string;
	saleId?: string;
	type: TransactionTypeEnum;
	status: TransactionStatusEnum;
	amount: number;
	proofOfPaymentUrl?: string;
	paymentId?: string;
	bankAccount?: string;
	message?: string;
	reviewerId?: string;
	createdAt: Date;
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
	saleId: string;
	amount: number;
}

export interface CreateWithdrawInput {
	accountId: string;
	amount: number;
	bankAccount: string;
}

export interface CreateOutput {
	transactionId: string;
}

export interface CompleteIncomeInput {
	transactionId: string;
	paymentId: string;
}

export interface CompleteWithdrawInput {
	status: TransactionStatusEnum.FAILED | TransactionStatusEnum.COMPLETED;
	message?: string;
	proofOfPaymentUrl?: string;
	reviewerId: string;
}

export interface GetByTransactionIdInput {
	transactionId: string;
}

export interface GetManyInput {
	accountId?: string;
	saleId?: string;
	status?: Array<TransactionStatusEnum>;
	type?: TransactionTypeEnum;
}

export interface TransactionRepository {
	createIncome: (i: CreateIncomeInput) => Promise<CreateOutput>;

	createWithdraw: (i: CreateWithdrawInput) => Promise<CreateOutput>;

	completeIncome: (i: CompleteIncomeInput) => Promise<void>;

	completeWithdraw: (i: CompleteWithdrawInput) => Promise<void>;

	getByTransactionId: (
		i: GetByTransactionIdInput,
	) => Promise<TransactionEntity | undefined>;

	getMany: (i: GetManyInput) => Promise<Array<TransactionEntity>>;
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
	amountToWithdraw: string;
	pending: string;
}

export interface RequestWithdrawInput {
	accountId: string;
	bankAccount: string;
	amount: number;
}

export interface WithdrawInput {
	reviewerId: string;
	transactionId: string;
	status: TransactionStatusEnum.FAILED | TransactionStatusEnum.COMPLETED;
	image?: Buffer;
	message?: string;
}

export interface TransactionUseCase {
	wallet: (i: WalletInput) => Promise<WalletOutput>;

	requestWithdraw: (i: RequestWithdrawInput) => Promise<void>;

	withdraw: (i: WithdrawInput) => Promise<void>;
}
