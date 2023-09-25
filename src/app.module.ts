import { Module } from '@nestjs/common';
import { MongoDBModule } from './repositories/mongodb';
import { AccountModule } from './usecases/account/account.module';

@Module({
  imports: [MongoDBModule.forRoot(), AccountModule],
})
export class AppModule {}
