import { Injectable } from '@nestjs/common';
import { DateAdapter as DateAdapterType, IsOfLegalAgeInput } from '../date';

@Injectable()
export class DateAdapter implements DateAdapterType {
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
}
