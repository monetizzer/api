import { Module } from '@nestjs/common';
import { SESService } from './ses.service';

@Module({
  providers: [SESService],
})
export class SESModule {}
