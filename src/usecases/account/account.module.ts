import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepositoryModule } from 'src/repositories/mongodb/account/account-repository.module';
import { JWTAdapter } from 'src/adapters/implementations/jwt.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { AuthController } from 'src/delivery/auth.controller';

@Module({
  controllers: [AuthController],
  imports: [AccountRepositoryModule],
  providers: [AccountService, DiscordJSAdapter, JWTAdapter],
})
export class AccountModule {}
