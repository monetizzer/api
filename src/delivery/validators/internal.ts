import {
	registerDecorator,
	ValidationOptions,
	ValidationArguments,
} from 'class-validator';
import {
	ALL_MEDIA_EXT,
	AUDIO_EXT,
	IMAGE_EXT,
	MediaTypeEnum,
	VIDEO_EXT,
} from 'src/types/enums/media-type';

export function IsID(validationOptions: ValidationOptions = {}) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isID',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: {
				message: `${propertyName} must be a valid ID`,
				...validationOptions,
			},
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _args: ValidationArguments) {
					return typeof value === 'string' && /^[a-z0-9]{16}$/i.test(value);
				},
			},
		});
	};
}

export function IsMagicLinkCode(validationOptions: ValidationOptions = {}) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isMagicLinkCode',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: {
				message: `${propertyName} must be a valid code`,
				...validationOptions,
			},
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _args: ValidationArguments) {
					return typeof value === 'string' && /^[a-z0-9]{32}$/i.test(value);
				},
			},
		});
	};
}

export function IsUsername(validationOptions: ValidationOptions = {}) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isUsername',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: {
				message: `${propertyName} must be a valid username`,
				...validationOptions,
			},
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _args: ValidationArguments) {
					return (
						typeof value === 'string' && /^[a-zA-Z0-9_-]{3,16}$/.test(value)
					);
				},
			},
		});
	};
}

export function IsHEXColor(validationOptions: ValidationOptions = {}) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isHEXColor',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: {
				message: `${propertyName} must be a valid HEX color`,
				...validationOptions,
			},
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _args: ValidationArguments) {
					return typeof value === 'string' && /^#[A-Fa-f0-9]{6}$/.test(value);
				},
			},
		});
	};
}

export function IsFileName(
	allowedTypes: Array<MediaTypeEnum> = [],
	validationOptions: ValidationOptions = {},
) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isFileName',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: {
				message: `${propertyName} must be a valid file name`,
				...validationOptions,
			},
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _args: ValidationArguments) {
					if (typeof value !== 'string') return false;

					const allowedExt = [];

					if (allowedTypes.length <= 0) {
						allowedExt.push(...ALL_MEDIA_EXT);
					}
					if (allowedTypes.includes(MediaTypeEnum.AUDIO)) {
						allowedExt.push(...AUDIO_EXT);
					}
					if (allowedTypes.includes(MediaTypeEnum.VIDEO)) {
						allowedExt.push(...VIDEO_EXT);
					}
					if (allowedTypes.includes(MediaTypeEnum.IMAGE)) {
						allowedExt.push(...IMAGE_EXT);
					}

					return new RegExp(
						`^[a-zA-Z0-9-]{1,}[.]{1}(${allowedExt.join('|')})$`,
					).test(value);
				},
			},
		});
	};
}
