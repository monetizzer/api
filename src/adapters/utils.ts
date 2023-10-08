export interface UtilsAdapter {
	cleanObj: <T>(i: Record<any, any>) => T;

	formatMoney: (i: number) => string;
}
