export interface IsOfLegalAgeInput {
	birthDate: string;
	minAge: number;
}

export interface DateAdapter {
	isOfLegalAge: (i: IsOfLegalAgeInput) => boolean;
}
