import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { decode } from 'jsonwebtoken';
import { TokenPayload } from 'src/adapters/token';
import { DocumentStatusEnum } from 'src/types/enums/document-status';

export const UserData = createParamDecorator(
	(data: undefined, ctx: ExecutionContext): any | undefined => {
		const request = ctx.switchToHttp().getRequest<Request>();

		const [type, token] = request.headers.authorization?.split(' ') ?? [];

		if (type === 'Bearer' && token) {
			const payload = decode(token) as TokenPayload;

			if (!payload) return {};

			return {
				accountId: payload.sub,
				storeId: payload.storeId,
				dvs: payload.dvs || DocumentStatusEnum['00'],
				isAdmin: payload.admin || false,
			};
		}

		if (type === 'Bot' && typeof request.headers['account-id'] === 'string') {
			return {
				accountId: request.headers['account-id'],
				storeId: request.headers['store-id'],
				dvs: request.headers['dvs'] || DocumentStatusEnum['00'],
				isAdmin: false, // Bot requests will never have admin permissions
			};
		}

		return {};
	},
);
