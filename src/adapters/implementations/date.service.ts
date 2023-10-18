import { Injectable } from '@nestjs/common';
import {
	DateAdapter as DateAdapterType,
	DateType,
	IsOfLegalAgeInput,
} from '../date';

@Injectable()
export class DateAdapter implements DateAdapterType {
	readonly ONE_SECOND = 1000;
	readonly ONE_MINUTE = 60 * this.ONE_SECOND;
	readonly ONE_HOUR = 60 * this.ONE_MINUTE;
	readonly ONE_DAY = 24 * this.ONE_HOUR;

	isOfLegalAge({ birthDate, minAge }: IsOfLegalAgeInput): boolean {
		const today = new Date();

		const eighteenYearsAgo = new Date(
			[
				today.getUTCFullYear() - minAge,
				today.getUTCMonth(),
				today.getUTCDate(),
			].join('-'),
		);

		return new Date(birthDate).getTime() <= eighteenYearsAgo.getTime();
	}

	todayPlus(amount: number, type: DateType): Date {
		const today = new Date().getTime();

		switch (type) {
			case 'days': {
				return new Date(today + amount * this.ONE_DAY);
			}
			case 'hours': {
				return new Date(today + amount * this.ONE_HOUR);
			}
			case 'minutes': {
				return new Date(today + amount * this.ONE_MINUTE);
			}
			case 'seconds': {
				return new Date(today + amount * this.ONE_SECOND);
			}
			default: {
				throw new Error('Unsupported date type');
			}
		}
	}
}
