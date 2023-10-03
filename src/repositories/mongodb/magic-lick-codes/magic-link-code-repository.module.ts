import { Module } from '@nestjs/common';
import { MagicLinkCodeRepositoryService } from './magic-link-code-repository.service';
import { MongoDBModule } from '..';
import { UIDSecretAdapter } from 'src/adapters/implementations/uid-secret.service';

@Module({
	imports: [MongoDBModule.forFeature(['magic_link_codes'])],
	providers: [MagicLinkCodeRepositoryService, UIDSecretAdapter],
	exports: [MagicLinkCodeRepositoryService],
})
export class MagicLinkCodeRepositoryModule {}
