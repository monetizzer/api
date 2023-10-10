import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { TokenPayload } from 'src/adapters/token';

@Injectable()
export class AdminGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		const [type, token] = request.headers.authorization?.split(' ') ?? [];

		if (type !== 'Bearer' || !token) {
			return false;
		}

		try {
			const payload = verify(token, process.env['JWT_SECRET']!) as TokenPayload;

			return Boolean(payload.admin);
		} catch {
			return false;
		}
	}
}
