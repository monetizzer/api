import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRepositoryModule } from 'src/repositories/mongodb/notification/notification-repository.module';
import { AccountRepositoryModule } from 'src/repositories/mongodb/account/account-repository.module';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { SESAdapter } from 'src/adapters/implementations/ses.service';

@Module({
  imports: [NotificationRepositoryModule, AccountRepositoryModule],
  providers: [NotificationService, SESAdapter, DiscordJSAdapter],
  exports: [NotificationService],
})
export class NotificationModule {}
