import { Module } from '@nestjs/common';
import { DiscordJSService } from './discordjs.service';

@Module({
  providers: [DiscordJSService],
})
export class DiscordJSModule {}
