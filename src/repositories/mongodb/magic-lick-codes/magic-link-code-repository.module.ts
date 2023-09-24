import { Module } from '@nestjs/common';
import { MagicLinkCodeRepositoryService } from './magic-link-code-repository.service';
import { MongoDBModule } from '..';

@Module({
  imports: [MongoDBModule.forFeature(['magic_link_codes'])],
  providers: [MagicLinkCodeRepositoryService],
  exports: [MagicLinkCodeRepositoryService],
})
export class MagicLinkCodeRepositoryModule {}
