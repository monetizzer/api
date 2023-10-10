import { Injectable } from '@nestjs/common';
import { GenInput, GenOutput, TokenAdapter } from '../token';
import { sign } from 'jsonwebtoken';

@Injectable()
export class JWTAdapter implements TokenAdapter {
	gen({ accountId, storeId, dvs, isAdmin }: GenInput): GenOutput {
		const accessToken = sign(
			{
				sub: accountId,
				storeId,
				admin: isAdmin,
				dvs,
			},
			process.env['JWT_SECRET'],
		);

		return {
			accessToken,
			expiresAt: '',
		};
	}
}
