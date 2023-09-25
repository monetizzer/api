import { Injectable } from '@nestjs/common';
import { GenInput, TokenAdapter } from '../token';
import { sign } from 'jsonwebtoken';

@Injectable()
export class JWTAdapter implements TokenAdapter {
  gen({ accountId }: GenInput): string {
    return sign(
      {
        sub: accountId,
      },
      process.env['JWT_SECRET'],
    );
  }
}
