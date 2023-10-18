import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CompleteWithdrawInput,
	CreateOutput,
	CreateWithdrawInput,
	GetBalanceInput,
	GetByTransactionIdInput,
	GetManyWithdrawInput,
	TransactionWithdrawEntity,
	TransactionWithdrawRepository,
} from 'src/models/transaction';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { Filter } from 'mongodb';

interface TransactionTable
	extends Omit<TransactionWithdrawEntity, 'transactionId'> {
	_id: string;
}

@Injectable()
export class WithdrawRepositoryService extends TransactionWithdrawRepository {
	constructor(
		@InjectRepository('transactions')
		private readonly transactionRepository: Repository<TransactionTable>,
		private readonly idAdapter: UIDAdapter,
	) {
		super();
	}

	async create({
		accountId,
		amount,
		bankAccount,
	}: CreateWithdrawInput): Promise<CreateOutput> {
		const transactionId = this.idAdapter.gen();

		await this.transactionRepository.insertOne({
			_id: transactionId,
			accountId,
			bankAccount,
			amount,
			type: TransactionTypeEnum.WITHDRAW,
			status: TransactionStatusEnum.PROCESSING,
			history: [
				{
					timestamp: new Date(),
					status: TransactionStatusEnum.PROCESSING,
					authorId: accountId,
				},
			],
			createdAt: new Date(),
		});

		return {
			transactionId,
		};
	}

	async complete({
		transactionId,
		...i
	}: CompleteWithdrawInput): Promise<void> {
		if (i.status === TransactionStatusEnum.COMPLETED) {
			const { status, proofOfPaymentUrl, authorId } = i;

			await this.transactionRepository.updateOne(
				{
					_id: transactionId,
				},
				{
					$set: {
						status,
						proofOfPaymentUrl,
					},
					$push: {
						history: {
							timestamp: new Date(),
							status,
							authorId,
						},
					},
				},
			);

			return;
		}

		const { status, message, authorId } = i;

		await this.transactionRepository.updateOne(
			{
				_id: transactionId,
			},
			{
				$set: {
					status,
				},
				$push: {
					history: {
						timestamp: new Date(),
						status,
						authorId,
						message,
					},
				},
			},
		);
	}

	async getByTransactionId({
		transactionId,
	}: GetByTransactionIdInput): Promise<TransactionWithdrawEntity> {
		const transaction = await this.transactionRepository.findOne({
			_id: transactionId,
		});

		if (!transaction) return;

		const { _id, ...transactionData } = transaction;

		return {
			...transactionData,
			transactionId: _id,
		};
	}

	async getMany({
		accountId,
		status,
	}: GetManyWithdrawInput): Promise<TransactionWithdrawEntity[]> {
		const filters: Filter<TransactionTable> = {
			type: TransactionTypeEnum.WITHDRAW,
		};

		if (accountId) {
			filters.accountId = accountId;
		}

		if (status) {
			filters.status = {
				$in: status,
			};
		}

		const transactionsCursor = this.transactionRepository.find(filters);
		const transactions = await transactionsCursor.toArray();

		return transactions.map((transaction) => {
			const { _id, ...transactionData } = transaction;

			return {
				...transactionData,
				transactionId: _id,
			};
		});
	}

	async getTotal({ accountId }: GetBalanceInput): Promise<number> {
		const transactionsCursor = this.transactionRepository.find(
			{
				accountId: accountId,
				status: {
					$in: [
						TransactionStatusEnum.COMPLETED,
						TransactionStatusEnum.PROCESSING,
					],
				},
				type: TransactionTypeEnum.WITHDRAW,
			},
			{
				projection: {
					amount: 1,
				},
			},
		);
		const transactions = await transactionsCursor.toArray();

		return transactions.reduce((acc, cur) => {
			return acc + cur.amount;
		}, 0);
	}
}
