import { TypeOrmModule } from '@nestjs/typeorm';

export const MongoDBModule = TypeOrmModule.forRoot({
  type: 'mongodb',
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] as unknown as number,
  username: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_DATABASE'],
  entities: [],
});
