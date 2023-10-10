import { Module } from '@nestjs/common';
import { RefreshTokenRepositoryService } from './refresh-token-repository.service';
import { MongoDBModule } from '..';
import { UIDSecretAdapter } from 'src/adapters/implementations/uid-secret.service';

@Module({
	imports: [MongoDBModule.forFeature(['refresh_tokens'])],
	providers: [RefreshTokenRepositoryService, UIDSecretAdapter],
	exports: [RefreshTokenRepositoryService],
})
export class RefreshTokenRepositoryModule {}
