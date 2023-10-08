import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import {
	GetPaymentProofImgInput,
	RequestWithdrawInput,
	TransactionUseCase,
	WalletInput,
	WalletOutput,
	WithdrawInput,
} from 'src/models/transaction';
import { TransactionRepositoryService } from 'src/repositories/mongodb/transaction/transaction-repository.service';
import {
	TransactionStatusEnum,
	canChangeStatus,
} from 'src/types/enums/transaction-status';
import { TransactionTypeEnum } from 'src/types/enums/transaction-type';
import { NotificationService } from '../notification/notification.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { Readable } from 'node:stream';

@Injectable()
export class TransactionService implements TransactionUseCase {
	constructor(
		@Inject(TransactionRepositoryService)
		private readonly transactionRepository: TransactionRepositoryService,
		private readonly notificationService: NotificationService,
		private readonly fileAdapter: S3Adapter,
		private readonly utilsAdapter: UtilsAdapter,
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

	async withdraw({
		transactionId,
		reviewerId,
		image,
	}: WithdrawInput): Promise<void> {
		const transaction = await this.transactionRepository.getByTransactionId({
			transactionId,
		});

		if (!transaction) {
			throw new NotFoundException('Transaction not found');
		}

		if (
			!canChangeStatus({
				oldStatus: transaction.status,
				newStatus: TransactionStatusEnum.COMPLETED,
			})
		) {
			throw new BadRequestException(
				`Can't change status from "${transaction.status}" to "${TransactionStatusEnum.COMPLETED}"`,
			);
		}

		const path = `/payment-proof/${transactionId}.jpeg`;

		await Promise.all([
			this.fileAdapter.save({
				folder: process.env['PRIVATE_BUCKET_NAME'],
				filePath: path as any,
				file: image,
			}),
			this.transactionRepository.completeWithdraw({
				transactionId,
				status: TransactionStatusEnum.COMPLETED,
				proofOfPaymentUrl: `${process.env['API_URL']}/wallet${path}`,
				reviewerId,
			}),
			this.notificationService.sendNotification({
				accountId: transaction.accountId,
				templateId: 'WITHDRAW_COMPLETED',
				data: {
					amount: this.utilsAdapter.formatMoney(transaction.amount),
				},
			}),
		]);
	}

	async getPaymentProofImg({
		accountId,
		transactionId,
		ext,
		isAdmin,
	}: GetPaymentProofImgInput): Promise<Readable> {
		if (!isAdmin) {
			const transaction = await this.transactionRepository.getByTransactionId({
				transactionId,
			});

			if (!transaction) {
				throw new NotFoundException('Transaction not found');
			}

			if (transaction.accountId !== accountId) {
				throw new ForbiddenException('Unable to access this file');
			}
		}

		return this.fileAdapter.getReadStream({
			folder: process.env['PRIVATE_BUCKET_NAME'],
			filePath: `/payment-proof/${transactionId}.${ext}`,
		});
	}
}
