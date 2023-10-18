import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import {
	BalanceInput,
	GetPaymentProofImgInput,
	RequestWithdrawInput,
	TransactionUseCase,
	WalletInput,
	WalletOutput,
	WithdrawInput,
} from 'src/models/transaction';
import {
	TransactionStatusEnum,
	canChangeStatus,
} from 'src/types/enums/transaction-status';
import { NotificationService } from '../notification/notification.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import { Readable } from 'node:stream';
import { IncomeRepositoryService } from 'src/repositories/mongodb/transaction/income-repository.service';
import { WithdrawRepositoryService } from 'src/repositories/mongodb/transaction/withdraw-repository.service';

@Injectable()
export class TransactionService extends TransactionUseCase {
	constructor(
		@Inject(IncomeRepositoryService)
		private readonly incomeRepository: IncomeRepositoryService,
		@Inject(WithdrawRepositoryService)
		private readonly withdrawRepository: WithdrawRepositoryService,
		private readonly notificationService: NotificationService,
		private readonly fileAdapter: S3Adapter,
		private readonly utilsAdapter: UtilsAdapter,
	) {
		super();
	}

	async wallet({ accountId }: WalletInput): Promise<WalletOutput> {
		const [totalAvailable, total, totalWithdrawn] = await Promise.all([
			this.incomeRepository.getTotalAvailable({ accountId }),
			this.incomeRepository.getTotal({ accountId }),
			this.withdrawRepository.getTotal({ accountId }),
		]);

		const availableToWithdraw = totalAvailable - totalWithdrawn;
		const pendingAndAvailableToWithdraw = total - totalAvailable;

		return {
			balance: availableToWithdraw,
			pending: pendingAndAvailableToWithdraw - availableToWithdraw,
			totalRevenue: total,
			totalWithdrawn: totalWithdrawn,
		};
	}

	async requestWithdraw({
		accountId,
		bankAccount,
		amount,
	}: RequestWithdrawInput): Promise<void> {
		const balance = await this.balance({ accountId });

		if (amount > balance) {
			throw new ForbiddenException('Unable to withdraw');
		}

		await Promise.all([
			this.withdrawRepository.create({
				accountId,
				amount,
				bankAccount,
			}),
			this.notificationService.sendInternalNotification({
				templateId: 'NEW_WITHDRAW_REQUESTED',
				data: {
					accountId,
					amount: this.utilsAdapter.formatMoney(amount),
					bankAccount,
				},
			}),
		]);
	}

	async withdraw({
		transactionId,
		authorId,
		image,
	}: WithdrawInput): Promise<void> {
		const transaction = await this.withdrawRepository.getByTransactionId({
			transactionId,
		});

		if (!transaction) {
			throw new NotFoundException('Transaction not found');
		}

		if (
			!canChangeStatus({
				type: transaction.type,
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
			this.withdrawRepository.complete({
				transactionId,
				status: TransactionStatusEnum.COMPLETED,
				proofOfPaymentUrl: `${process.env['API_URL']}/wallet${path}`,
				authorId,
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
			const transaction = await this.withdrawRepository.getByTransactionId({
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

	protected async balance({ accountId }: BalanceInput): Promise<number> {
		const [totalAvailable, totalWithdrawn] = await Promise.all([
			this.incomeRepository.getTotalAvailable({ accountId }),
			this.withdrawRepository.getTotal({ accountId }),
		]);

		return totalAvailable - totalWithdrawn;
	}
}
