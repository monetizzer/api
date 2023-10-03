import { Injectable } from '@nestjs/common';
import { DateAdapter } from '../date';
import { add, isBefore } from 'date-fns';

@Injectable()
export class DateFnsAdapter implements DateAdapter {
	hasMoreThan18(birth: string): boolean {
		const eighteenYearsAgo = add(new Date(), {
			years: -18,
		});

		const birthDate = new Date(birth);

		const isOlder = isBefore(new Date(birthDate), eighteenYearsAgo);

		if (isOlder) return true;

		const birthDateDay = birthDate.getDate();
		const birthDateMonth = birthDate.getMonth();
		const birthDateYear = birthDate.getFullYear();

		const eighteenYearsAgoDay = birthDate.getDate();
		const eighteenYearsAgoMonth = birthDate.getMonth();
		const eighteenYearsAgoYear = birthDate.getFullYear();

		const isBirthDay =
			birthDateDay === eighteenYearsAgoDay &&
			birthDateMonth === eighteenYearsAgoMonth &&
			birthDateYear === eighteenYearsAgoYear;

		return isBirthDay;
	}
}
