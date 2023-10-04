export enum DeliveryMethodEnum {
	AUTOMATIC_OUR_PLATFORM = 'AUTOMATIC_OUR_PLATFORM',
	MANUAL_OUR_PLATFORM = 'MANUAL_OUR_PLATFORM',
}

export const isAutomaticDelivery = (deliveryMethod: DeliveryMethodEnum) =>
	deliveryMethod.startsWith('AUTOMATIC_');

export const isManualDelivery = (deliveryMethod: DeliveryMethodEnum) =>
	deliveryMethod.startsWith('MANUAL_');
