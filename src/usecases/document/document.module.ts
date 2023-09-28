import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentRepositoryModule } from 'src/repositories/mongodb/document/document-repository.module';
import { DocumentController } from 'src/delivery/document.controller';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';

@Module({
  controllers: [DocumentController],
  imports: [DocumentRepositoryModule],
  providers: [DocumentService, S3Adapter, DiscordJSAdapter],
})
export class DocumentModule {}
