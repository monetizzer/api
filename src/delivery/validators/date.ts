import {
	registerDecorator,
	ValidationOptions,
	ValidationArguments,
} from 'class-validator';
import { isValid } from 'date-fns';

export function IsDateYYYYMMDD(validationOptions: ValidationOptions = {}) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isDateYYYYMMDD',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: {
				message: `${propertyName} must be a valid birth date`,
				...validationOptions,
			},
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _args: ValidationArguments) {
					if (typeof value !== 'string') return false;

					if (!isValid(value)) return false;

					return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value);
				},
			},
		});
	};
}
