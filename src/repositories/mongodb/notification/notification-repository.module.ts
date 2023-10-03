import { Module } from '@nestjs/common';
import { NotificationRepositoryService } from './notification-repository.service';
import { MongoDBModule } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';

@Module({
	imports: [MongoDBModule.forFeature(['notifications'])],
	providers: [NotificationRepositoryService, UIDAdapter],
	exports: [NotificationRepositoryService],
})
export class NotificationRepositoryModule {}
