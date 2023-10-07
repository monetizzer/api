import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import { TokenPayload } from 'src/adapters/token';

export const AccountId = createParamDecorator(
	(data: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();

		const token = request.cookies?.['access-token'];

		const payload = decode(token) as TokenPayload;

		return payload.sub;
	},
);
