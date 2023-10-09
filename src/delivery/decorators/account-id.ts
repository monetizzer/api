import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { decode } from 'jsonwebtoken';
import { TokenPayload } from 'src/adapters/token';

export const AccountId = createParamDecorator(
	(data: undefined, ctx: ExecutionContext): string | undefined => {
		const request = ctx.switchToHttp().getRequest<Request>();

		const [type, token] = request.headers.authorization?.split(' ') ?? [];

		if (type === 'USER' && token) {
			const payload = decode(token) as TokenPayload;

			return payload?.sub;
		}

		if (type === 'BOT' && typeof request.query.accountId === 'string') {
			return request.query.accountId;
		}
	},
);
