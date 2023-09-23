import { Module } from '@nestjs/common';
import { MongoDBModule } from './repositories/mongodb';

@Module({
  imports: [MongoDBModule.forRoot()],
})
export class AppModule {}
