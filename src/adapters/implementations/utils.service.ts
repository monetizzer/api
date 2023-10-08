import { Injectable } from '@nestjs/common';
import { UtilsAdapter as UtilsAdapterType } from '../utils';
import { cleanObj } from '@techmmunity/utils';

@Injectable()
export class UtilsAdapter implements UtilsAdapterType {
	cleanObj<T>(i: Record<any, any>): T {
		return cleanObj(i) as T;
	}

	formatMoney(valueNumber: number): string {
		const value = valueNumber.toString();

		const decimalsStart = value.length - 2;

		const formatter = new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		});

		return formatter.format(
			parseFloat(
				[
					value.substring(0, decimalsStart),
					'.',
					value.substring(decimalsStart),
				].join(''),
			),
		);
	}
}
