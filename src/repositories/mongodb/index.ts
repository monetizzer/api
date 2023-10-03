import type { DynamicModule } from '@nestjs/common';
import { Inject, Module } from '@nestjs/common';
import { MongoDBCoreModule } from './core';
import { MONGODB_CONNECTION_NAME } from './core';
import { Collection, MongoClient } from 'mongodb';

@Module({})
export class MongoDBModule {
	public static forRoot(): DynamicModule {
		return {
			module: MongoDBModule,
			imports: [MongoDBCoreModule.forRoot()],
		};
	}

	public static forFeature(tableNames: Array<string> = []): DynamicModule {
		const providers = tableNames.map((tableName) => ({
			provide: MongoDBModule.getRepositoryToken(tableName),
			useFactory: (connection: MongoClient) =>
				connection.db(process.env['DB_DATABASE']).collection(tableName),
			inject: [MONGODB_CONNECTION_NAME],
		}));

		return {
			module: MongoDBModule,
			providers,
			exports: providers,
		};
	}

	public static getRepositoryToken(table: string) {
		return `MONGODB_${table.toUpperCase()}_REPOSITORY`;
	}
}

export const InjectRepository = (tableName: string) =>
	Inject(MongoDBModule.getRepositoryToken(tableName));

export type Repository<T> = Collection<T>;
