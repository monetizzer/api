export interface IsOfLegalAgeInput {
	birthDate: string;
	minAge: number;
}

export type DateType = 'days' | 'seconds' | 'minutes' | 'hours';

export interface DateAdapter {
	isOfLegalAge: (i: IsOfLegalAgeInput) => boolean;

	todayPlus: (amount: number, type: DateType) => Date;
}
