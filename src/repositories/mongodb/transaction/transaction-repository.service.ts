import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CompleteIncomeInput,
	CompleteWithdrawInput,
	CreateIncomeInput,
	CreateOutput,
	CreateWithdrawInput,
	GetByTransactionIdInput,
	GetManyInput,
	TransactionEntity,
	TransactionRepository,
} from 'src/models/transaction';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { Filter, MatchKeysAndValues } from 'mongodb';

interface TransactionTable extends Omit<TransactionEntity, 'transactionId'> {
	_id: string;
}

@Injectable()
export class TransactionRepositoryService implements TransactionRepository {
	constructor(
		@InjectRepository('transactions')
		private readonly transactionRepository: Repository<TransactionTable>,
		private readonly idAdapter: UIDAdapter,
	) {}

	async createIncome({
		accountId,
		amount,
		saleId,
	}: CreateIncomeInput): Promise<CreateOutput> {
		const transactionId = this.idAdapter.gen();

		await this.transactionRepository.insertOne({
			accountId,
			saleId,
			amount,
			type: TransactionTypeEnum.INCOME,
			status: TransactionStatusEnum.PROCESSING,
			createdAt: new Date(),
			_id: transactionId,
		});

		return {
			transactionId,
		};
	}

	async createWithdraw({
		accountId,
		amount,
		bankAccount,
	}: CreateWithdrawInput): Promise<CreateOutput> {
		const transactionId = this.idAdapter.gen();

		await this.transactionRepository.insertOne({
			accountId,
			bankAccount,
			amount,
			type: TransactionTypeEnum.WITHDRAW,
			status: TransactionStatusEnum.PROCESSING,
			createdAt: new Date(),
			_id: transactionId,
		});

		return {
			transactionId,
		};
	}

	async completeIncome({
		transactionId,
		...i
	}: CompleteIncomeInput): Promise<void> {
		let data: MatchKeysAndValues<TransactionTable> = {};

		if (i.status === TransactionStatusEnum.COMPLETED) {
			const { status, paymentId } = i;

			data = {
				status,
				paymentId,
			};
		} else {
			const { status, message, reviewerId } = i;

			data = {
				status,
				message,
				reviewerId,
			};
		}

		await this.transactionRepository.updateOne(
			{
				_id: transactionId,
			},
			{
				$set: data,
			},
		);
	}

	async completeWithdraw({
		transactionId,
		...i
	}: CompleteWithdrawInput): Promise<void> {
		let data: MatchKeysAndValues<TransactionTable> = {};

		if (i.status === TransactionStatusEnum.COMPLETED) {
			const { status, proofOfPaymentUrl, reviewerId } = i;

			data = {
				status,
				proofOfPaymentUrl,
				reviewerId,
			};
		} else {
			const { status, message, reviewerId } = i;

			data = {
				status,
				message,
				reviewerId,
			};
		}

		await this.transactionRepository.updateOne(
			{
				_id: transactionId,
			},
			{
				$set: data,
			},
		);
	}

	async getByTransactionId({
		transactionId,
	}: GetByTransactionIdInput): Promise<TransactionEntity> {
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
		saleId,
		status,
		type,
	}: GetManyInput): Promise<TransactionEntity[]> {
		const filters: Filter<TransactionTable> = {};

		if (accountId) {
			filters.accountId = accountId;
		}

		if (saleId) {
			filters.saleId = saleId;
		}

		if (status) {
			filters.status = {
				$in: status,
			};
		}

		if (type) {
			filters.type = type;
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
}
