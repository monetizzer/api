import { Module } from '@nestjs/common';
import { MongoDBModule } from './repositories/mongodb';
import { AccountModule } from './usecases/account/account.module';
import { TermsModule } from './usecases/terms/terms.module';

@Module({
  imports: [MongoDBModule.forRoot(), AccountModule, TermsModule],
})
export class AppModule {}
