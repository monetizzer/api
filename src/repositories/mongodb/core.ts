import type {
	DynamicModule,
	OnApplicationShutdown,
	Provider,
} from '@nestjs/common';
import { Global, Logger, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { MongoClient } from 'mongodb';

export const MONGODB_CONNECTION_NAME = 'MONGODB_CONNECTION';

@Global()
@Module({})
export class MongoDBCoreModule implements OnApplicationShutdown {
	public constructor(private readonly moduleRef: ModuleRef) {}

	public static forRoot(): DynamicModule {
		const connectionsProviders: Provider = {
			provide: MONGODB_CONNECTION_NAME,
			useFactory: async () => {
				const connection = new MongoClient(process.env['MONGODB_URL']);

				await connection.connect();

				Logger.log('Connected to mongodb!');

				return connection;
			},
		};

		return {
			module: MongoDBCoreModule,
			providers: [connectionsProviders],
			exports: [connectionsProviders],
		};
	}

	public async onApplicationShutdown() {
		const connection = this.moduleRef.get(MONGODB_CONNECTION_NAME);

		try {
			await connection?.close();
		} catch (e: any) {
			Logger.error(e?.message);
		}
	}
}
