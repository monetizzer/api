import { TransactionTypeEnum } from './transaction-type';

export enum TransactionStatusEnum {
	'PROCESSING' = 'PROCESSING',
	'COMPLETED' = 'COMPLETED',
	'FAILED' = 'FAILED',

	// Exclusive for type=INCOME
	'REFUND_PROCESSING' = 'REFUND_PROCESSING',
	'REFUND_COMPLETED' = 'REFUND_COMPLETED',
	'REFUND_FAILED' = 'REFUND_FAILED',
}

interface CanChangeStatusInput {
	type: TransactionTypeEnum;
	oldStatus?: TransactionStatusEnum;
	newStatus: TransactionStatusEnum;
}

export const canChangeStatus = ({
	type,
	oldStatus,
	newStatus,
}: CanChangeStatusInput): boolean => {
	switch (oldStatus) {
		case TransactionStatusEnum.PROCESSING: {
			return [
				TransactionStatusEnum.FAILED,
				TransactionStatusEnum.COMPLETED,
			].includes(newStatus);
		}

		case TransactionStatusEnum.COMPLETED: {
			if (type === TransactionTypeEnum.WITHDRAW) {
				return false;
			}

			return [TransactionStatusEnum.REFUND_PROCESSING].includes(newStatus);
		}

		case TransactionStatusEnum.REFUND_PROCESSING: {
			return [
				TransactionStatusEnum.REFUND_COMPLETED,
				TransactionStatusEnum.REFUND_FAILED,
			].includes(newStatus);
		}

		case TransactionStatusEnum.FAILED:
		case TransactionStatusEnum.REFUND_COMPLETED:
		case TransactionStatusEnum.REFUND_FAILED:
		default: {
			return false;
		}
	}
};
