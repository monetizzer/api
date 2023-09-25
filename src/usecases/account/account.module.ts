import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepositoryModule } from 'src/repositories/mongodb/account/account-repository.module';
import { JWTAdapter } from 'src/adapters/implementations/jwt.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { AuthController } from 'src/delivery/auth.controller';
import { MagicLinkCodeRepositoryModule } from 'src/repositories/mongodb/magic-lick-codes/magic-link-code-repository.module';

@Module({
  controllers: [AuthController],
  imports: [AccountRepositoryModule, MagicLinkCodeRepositoryModule],
  providers: [AccountService, DiscordJSAdapter, JWTAdapter],
})
export class AccountModule {}
