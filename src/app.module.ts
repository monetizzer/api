import { Module } from '@nestjs/common';
import { AccountModule } from './api/account/account.module';

@Module({
  imports: [AccountModule],
})
export class AppModule {}
