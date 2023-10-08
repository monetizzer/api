export enum TransactionStatusEnum {
	'PROCESSING' = 'PROCESSING',
	'COMPLETED' = 'COMPLETED',
	'FAILED' = 'FAILED',
}

interface CanChangeStatusInput {
	oldStatus?: TransactionStatusEnum;
	newStatus: TransactionStatusEnum;
}

export const canChangeStatus = ({
	oldStatus,
	newStatus,
}: CanChangeStatusInput): boolean => {
	switch (oldStatus) {
		case TransactionStatusEnum.PROCESSING:
		default: {
			return [
				TransactionStatusEnum.FAILED,
				TransactionStatusEnum.COMPLETED,
			].includes(newStatus);
		}

		case TransactionStatusEnum.FAILED:
		case TransactionStatusEnum.COMPLETED: {
			return false;
		}
	}
};
