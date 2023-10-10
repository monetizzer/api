import { Injectable } from '@nestjs/common';
import { GenInput, TokenAdapter } from '../token';
import { sign } from 'jsonwebtoken';

@Injectable()
export class JWTAdapter implements TokenAdapter {
	gen({ accountId, storeId, dvs, isAdmin }: GenInput): string {
		return sign(
			{
				sub: accountId,
				storeId,
				admin: isAdmin,
				dvs,
			},
			process.env['JWT_SECRET'],
		);
	}
}
