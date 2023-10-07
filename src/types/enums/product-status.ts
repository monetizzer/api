export enum ProductStatusEnum {
	'IN_PREPARATION' = 'IN_PREPARATION',
	'VALIDATING' = 'VALIDATING',
	'APPROVED' = 'APPROVED',
	'REPROVED' = 'REPROVED',
	'PAUSED' = 'PAUSED',
}

interface CanChangeStatusInput {
	oldStatus?: ProductStatusEnum;
	newStatus: ProductStatusEnum;
}

interface CanBeEditedInput {
	status: ProductStatusEnum;
}

export const canChangeStatus = ({
	oldStatus,
	newStatus,
}: CanChangeStatusInput): boolean => {
	switch (oldStatus) {
		case ProductStatusEnum.IN_PREPARATION:
		default: {
			return [ProductStatusEnum.VALIDATING].includes(newStatus);
		}

		case ProductStatusEnum.VALIDATING: {
			return [ProductStatusEnum.APPROVED, ProductStatusEnum.REPROVED].includes(
				newStatus,
			);
		}

		case ProductStatusEnum.APPROVED: {
			return [ProductStatusEnum.PAUSED].includes(newStatus);
		}

		case ProductStatusEnum.REPROVED: {
			return [ProductStatusEnum.VALIDATING].includes(newStatus);
		}

		case ProductStatusEnum.PAUSED: {
			return [ProductStatusEnum.VALIDATING].includes(newStatus);
		}
	}
};

export const canBeEdited = ({ status }: CanBeEditedInput) => {
	return [
		ProductStatusEnum.IN_PREPARATION,
		ProductStatusEnum.PAUSED,
		ProductStatusEnum.REPROVED,
	].includes(status);
};
