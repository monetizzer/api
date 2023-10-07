import { Inject, Injectable } from '@nestjs/common';
import {
	RequestWithdrawInput,
	TransactionUseCase,
	WalletInput,
	WalletOutput,
	WithdrawInput,
} from 'src/models/transaction';
import { TransactionRepositoryService } from 'src/repositories/mongodb/transaction/transaction-repository.service';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';

@Injectable()
export class TransactionService implements TransactionUseCase {
	constructor(
		@Inject(TransactionRepositoryService)
		private readonly transactionRepository: TransactionRepositoryService,
	) {}

	async wallet({ accountId }: WalletInput): Promise<WalletOutput> {
		const [
			completedTransactions,
			processingTransactions,
			processingIncomeTransactions,
		] = await Promise.all([
			this.transactionRepository.getMany({
				accountId,
				status: [TransactionStatusEnum.COMPLETED],
			}),
			this.transactionRepository.getMany({
				accountId,
				status: [TransactionStatusEnum.PROCESSING],
				type: TransactionTypeEnum.WITHDRAW,
			}),
			this.transactionRepository.getMany({
				accountId,
				status: [TransactionStatusEnum.PROCESSING],
				type: TransactionTypeEnum.INCOME,
			}),
		]);

		const transactions = [
			...completedTransactions,
			...processingTransactions,
		].sort((a, b) => (a.createdAt.getTime() > b.createdAt.getTime() ? 1 : -1));

		const balance = transactions.reduce((acc, cur) => {
			if (cur.type === TransactionTypeEnum.INCOME) {
				return acc + cur.amount;
			}

			if (cur.type === TransactionTypeEnum.WITHDRAW) {
				return acc - cur.amount;
			}

			return acc;
		}, 0);

		const pending = processingIncomeTransactions.reduce((acc, cur) => {
			return acc + cur.amount;
		}, 0);

		return {
			pending,
			balance,
		};
	}

	requestWithdraw: (i: RequestWithdrawInput) => Promise<void>;

	withdraw: (i: WithdrawInput) => Promise<void>;
}
