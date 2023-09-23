import { Module } from '@nestjs/common';
import { MongoDBModule } from './repositories/mongodb';

@Module({
  imports: [MongoDBModule],
})
export class AppModule {}
