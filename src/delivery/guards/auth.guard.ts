import {
  CanActivate,
  ExecutionContext,
  Type,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Request } from 'express';
import { AuthType } from './types';

export const AuthGuard = (types: Array<AuthType>): Type<CanActivate> => {
  class AuthGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();

      const validations = [] as Array<boolean>;

      if (types.includes('USER')) {
        validations.push(this.validateUserAuth(request));
      }

      return validations.some(Boolean);
    }

    private validateUserAuth(request: Request) {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];

      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException();
      }

      try {
        verify(token, process.env['JWT_SECRET']!);
      } catch {
        throw new UnauthorizedException();
      }

      return true;
    }
  }

  const guard = mixin(AuthGuardMixin);
  return guard;
};
