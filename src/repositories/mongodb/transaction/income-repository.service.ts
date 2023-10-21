import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CompleteIncomeInput,
	CompleteRefundInput,
	CreateIncomeInput,
	CreateOutput,
	GetBalanceInput,
	GetManyBySaleIdInput,
	RequestRefundInput,
	SetSaleAsDeliveredInput,
	TransactionIncomeEntity,
	TransactionIncomeRepository,
} from 'src/models/transaction';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';
import { TransactionStatusEnum } from 'src/types/enums/transaction-status';
import { DateAdapter } from 'src/adapters/implementations/date.service';
import { PaymentMethodEnum } from 'src/types/enums/payment-method';

interface TransactionTable
	extends Omit<TransactionIncomeEntity, 'transactionId'> {
	_id: string;
}

@Injectable()
export class IncomeRepositoryService extends TransactionIncomeRepository {
	readonly warrantyDays = 3;

	constructor(
		@InjectRepository('transactions')
		private readonly transactionRepository: Repository<TransactionTable>,
		private readonly idAdapter: UIDAdapter,
		private readonly dateAdapter: DateAdapter,
	) {
		super();
	}

	async create({
		accountId,
		amount,
		saleId,
		paymentMethod,
		provider,
		pixCode,
		pixExpiresAt,
	}: CreateIncomeInput): Promise<CreateOutput> {
		const transactionId = this.idAdapter.gen();

		await this.transactionRepository.insertOne({
			_id: transactionId,
			accountId,
			saleId,
			amount,
			paymentMethod,
			provider,
			pixCode,
			pixExpiresAt,
			type: TransactionTypeEnum.INCOME,
			status: TransactionStatusEnum.PROCESSING,
			history: [
				{
					timestamp: new Date(),
					status: TransactionStatusEnum.PROCESSING,
					authorId: 'SYSTEM',
				},
			],
			createdAt: new Date(),
		});

		return {
			transactionId,
		};
	}

	async complete({ transactionId, ...i }: CompleteIncomeInput): Promise<void> {
		if (i.status === TransactionStatusEnum.COMPLETED) {
			const { status, paymentId, setSaleAsDelivered } = i;

			await this.transactionRepository.updateOne(
				{
					_id: transactionId,
				},
				{
					$set: {
						status,
						paymentId,
						paidAt: new Date(),
						...(setSaleAsDelivered
							? {
									saleDeliveredAt: new Date(), // Only for pre made products!
							  }
							: {}),
					},
					$addToSet: {
						history: {
							timestamp: new Date(),
							status,
							authorId: 'SYSTEM',
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
				$addToSet: {
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

	async getManyBySaleId({
		saleId,
	}: GetManyBySaleIdInput): Promise<TransactionIncomeEntity[]> {
		const transactionsCursor = this.transactionRepository.find({
			saleId,
			type: TransactionTypeEnum.INCOME,
		});
		const transactions = await transactionsCursor.toArray();

		return transactions.map(({ _id, ...transaction }) => {
			return {
				...transaction,
				transactionId: _id,
			};
		});
	}

	async getTotalAvailable({ accountId }: GetBalanceInput): Promise<number> {
		const transactionsCursor = this.transactionRepository.find(
			[
				// Each payment method has to have it's own condition,
				// because each one of them has it's own paidAt requirement
				// See more at: https://app.clickup.com/t/866ayq9ey
				{
					accountId: accountId,
					status: TransactionStatusEnum.COMPLETED,
					type: TransactionTypeEnum.INCOME,
					saleDeliveredAt: {
						$lte: this.dateAdapter.nowPlus(this.warrantyDays, 'days'),
					},
					paymentMethod: PaymentMethodEnum.PIX,
					// paidAt: {$exists: true} Unnecessary, since status=COMPLETED and pix are immediately available to withdraw
				},
			],
			{
				projection: {
					amount: true,
				},
			},
		);
		const transactions = await transactionsCursor.toArray();

		return transactions.reduce((acc, cur) => {
			return acc + cur.amount;
		}, 0);
	}

	async getTotal({ accountId }: GetBalanceInput): Promise<number> {
		const transactionsCursor = this.transactionRepository.find(
			[
				// Each payment method has to have it's own condition,
				// because each one of them has it's own paidAt requirement
				// See more at: https://app.clickup.com/t/866ayq9ey
				{
					accountId: accountId,
					status: TransactionStatusEnum.COMPLETED,
					type: TransactionTypeEnum.INCOME,
					saleDeliveredAt: {
						$gt: this.dateAdapter.nowPlus(-this.warrantyDays, 'days'),
					},
					paymentMethod: PaymentMethodEnum.PIX,
					// paidAt: {$exists: true} Unnecessary, since status=COMPLETED and pix are immediately available to withdraw
				},
			],
			{
				projection: {
					amount: true,
				},
			},
		);
		const transactions = await transactionsCursor.toArray();

		return transactions.reduce((acc, cur) => {
			return acc + cur.amount;
		}, 0);
	}

	async requestRefund({
		authorId,
		saleId,
	}: RequestRefundInput): Promise<TransactionIncomeEntity[]> {
		await this.transactionRepository.updateMany(
			{
				saleId,
				status: TransactionStatusEnum.COMPLETED,
				// type: TransactionTypeEnum.INCOME, Unnecessary because of saleId
				// paymentId: { Unnecessary  because of saleId + status=COMPLETED
				// 	$exists: true,
				// },
			},
			{
				$set: {
					status: TransactionStatusEnum.REFUND_PROCESSING,
				},
				$addToSet: {
					history: {
						timestamp: new Date(),
						status: TransactionStatusEnum.REFUND_PROCESSING,
						authorId,
					},
				},
			},
		);

		const transactionsCursor = this.transactionRepository.find({
			saleId,
			status: TransactionStatusEnum.REFUND_PROCESSING,
			type: TransactionTypeEnum.INCOME,
		});
		const transactions = await transactionsCursor.toArray();

		return transactions.map((transaction) => {
			const { _id, ...transactionData } = transaction;

			return {
				...transactionData,
				transactionId: _id,
			};
		});
	}

	async completeRefund({
		saleId,
		status,
		message,
	}: CompleteRefundInput): Promise<void> {
		await this.transactionRepository.updateMany(
			{
				saleId,
				status: TransactionStatusEnum.REFUND_PROCESSING,
			},
			{
				$set: {
					status,
				},
				$addToSet: {
					history: {
						timestamp: new Date(),
						status,
						authorId: 'SYSTEM',
						message,
					},
				},
			},
		);
	}

	async setSaleAsDelivered({ saleId }: SetSaleAsDeliveredInput): Promise<void> {
		await this.transactionRepository.updateMany(
			{
				saleId,
				status: TransactionStatusEnum.COMPLETED,
			},
			{
				$set: {
					saleDeliveredAt: new Date(),
				},
			},
		);
	}
}
