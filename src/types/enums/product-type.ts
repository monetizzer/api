export enum ProductTypeEnum {
	PACK = 'PACK',
	AUDIO = 'AUDIO',
	VIDEO = 'VIDEO',
	IMAGE = 'IMAGE',
	CUSTOM_AUDIO = 'CUSTOM_AUDIO',
	CUSTOM_VIDEO = 'CUSTOM_VIDEO',
	CUSTOM_IMAGE = 'CUSTOM_IMAGE', // Plaquinha
	RENT_A_GIRLFRIEND = 'RENT_A_GIRLFRIEND',
	SEXY_VOICE_CALL = 'SEXY_VOICE_CALL', // GF
	SEXY_VIDEO_CALL = 'SEXY_VIDEO_CALL',
}

export const isPreMadeProduct = (type: ProductTypeEnum) =>
	[
		ProductTypeEnum.PACK,
		ProductTypeEnum.AUDIO,
		ProductTypeEnum.VIDEO,
		ProductTypeEnum.IMAGE,
	].includes(type);

export const isCustomProduct = (type: ProductTypeEnum) =>
	[
		ProductTypeEnum.CUSTOM_AUDIO,
		ProductTypeEnum.CUSTOM_IMAGE,
		ProductTypeEnum.CUSTOM_VIDEO,
	].includes(type);

export const isLiveProduct = (type: ProductTypeEnum) =>
	[ProductTypeEnum.SEXY_VOICE_CALL, ProductTypeEnum.SEXY_VIDEO_CALL].includes(
		type,
	);
