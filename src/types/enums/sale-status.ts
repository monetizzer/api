import { ProductTypeEnum, isPreMadeProduct } from './product-type';

/**
 * https://app.clickup.com/30989429/v/dc/xhq3n-340/xhq3n-600?block=block-2b56e8f0-52b7-450f-be8f-dda338025371
 */
export enum SalesStatusEnum {
	PENDING = 'PENDING',
	PAID = 'PAID',

	// Set as delivered but awaiting confirmation from the buyer
	DELIVERED = 'DELIVERED',

	// Ended in a happy way
	CONFIRMED_DELIVERY = 'CONFIRMED_DELIVERY',

	// A problem occurred and we are trying to solve
	IN_DISPUTE = 'IN_DISPUTE',

	// Ended in a sad way
	EXPIRED = 'EXPIRED',
	CANCELED = 'CANCELED',
	REFUNDED = 'REFUNDED',
}

interface CanChangeStatusInput {
	productsTypes: Array<ProductTypeEnum>;
	oldStatus?: SalesStatusEnum;
	newStatus: SalesStatusEnum;
}

export const canChangeStatus = ({
	productsTypes,
	oldStatus,
	newStatus,
}: CanChangeStatusInput): boolean => {
	switch (oldStatus) {
		case SalesStatusEnum.PENDING: {
			if (productsTypes.every(isPreMadeProduct)) {
				return [
					SalesStatusEnum.EXPIRED,
					SalesStatusEnum.CANCELED,
					SalesStatusEnum.CONFIRMED_DELIVERY,
				].includes(newStatus);
			}

			return [
				SalesStatusEnum.EXPIRED,
				SalesStatusEnum.CANCELED,
				SalesStatusEnum.PAID,
			].includes(newStatus);
		}

		case SalesStatusEnum.PAID: {
			return [SalesStatusEnum.IN_DISPUTE, SalesStatusEnum.DELIVERED].includes(
				newStatus,
			);
		}

		case SalesStatusEnum.DELIVERED: {
			return [
				SalesStatusEnum.IN_DISPUTE,
				SalesStatusEnum.CONFIRMED_DELIVERY,
			].includes(newStatus);
		}

		case SalesStatusEnum.IN_DISPUTE: {
			return [
				SalesStatusEnum.REFUNDED,
				SalesStatusEnum.CONFIRMED_DELIVERY,
			].includes(newStatus);
		}

		case SalesStatusEnum.EXPIRED:
		case SalesStatusEnum.CANCELED:
		case SalesStatusEnum.REFUNDED:
		case SalesStatusEnum.CONFIRMED_DELIVERY:
		default: {
			return false;
		}
	}
};
