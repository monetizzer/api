import { CanActivate, ExecutionContext, Type, mixin } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Request } from 'express';
import { AuthType } from './types';
import { ID_REGEX } from '../validators/internal';

export const AuthGuard = (types: Array<AuthType>): Type<CanActivate> => {
	class AuthGuardMixin implements CanActivate {
		async canActivate(context: ExecutionContext): Promise<boolean> {
			const request = context.switchToHttp().getRequest();

			const validations = [] as Array<boolean>;

			if (types.includes('USER')) {
				validations.push(this.validateUserAuth(request));
			}

			if (types.includes('BOT')) {
				validations.push(this.validateBotAuth(request));
			}

			return validations.some(Boolean);
		}

		private validateUserAuth(request: Request) {
			const [type, token] = request.headers.authorization?.split(' ') ?? [];

			if (type !== 'Bearer' || !token) {
				return false;
			}

			try {
				verify(token, process.env['JWT_SECRET']!);
			} catch {
				return false;
			}

			return true;
		}

		private validateBotAuth(request: Request) {
			const [type, token] = request.headers.authorization?.split(' ') ?? [];

			if (type !== 'Bot' || !token) {
				return false;
			}

			try {
				verify(token, process.env['JWT_SECRET']!);
			} catch {
				return false;
			}

			const accountId = request.query.accountId;

			if (typeof accountId !== 'string') {
				return false;
			}

			return ID_REGEX.test(accountId);
		}
	}

	const guard = mixin(AuthGuardMixin);
	return guard;
};
