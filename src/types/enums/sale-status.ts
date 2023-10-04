/**
 * https://app.clickup.com/30989429/v/dc/xhq3n-340/xhq3n-600?block=block-2b56e8f0-52b7-450f-be8f-dda338025371
 */
export enum SalesStatusEnum {
	PENDING = 'PENDING',
	PAID = 'PAID',
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
