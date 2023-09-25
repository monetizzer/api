import { Injectable } from '@nestjs/common';
import { IsLatestInput, LatestInput, VersionAdapter } from '../version';

import sortSemVer from 'semver/functions/sort';
import gtSemVer from 'semver/functions/gt';

@Injectable()
export class SemVerAdapter implements VersionAdapter {
  latest({ versions }: LatestInput): string {
    const [latestSemVer] = sortSemVer(versions);

    return latestSemVer;
  }

  isGt({ toValidate, compareWith }: IsLatestInput): boolean {
    if (!compareWith) return true;
    if (!toValidate) return false;

    return gtSemVer(toValidate, compareWith);
  }
}
