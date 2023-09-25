import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepositoryModule } from 'src/repositories/mongodb/account/account-repository.module';
import { JWTAdapter } from 'src/adapters/implementations/jwt.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { AuthController } from 'src/delivery/auth.controller';
import { MagicLinkCodeRepositoryModule } from 'src/repositories/mongodb/magic-lick-codes/magic-link-code-repository.module';
import { TermsRepositoryModule } from 'src/repositories/mongodb/terms/terms-repository.module';
import { SemVerAdapter } from 'src/adapters/implementations/semver.service';

@Module({
  controllers: [AuthController],
  imports: [
    AccountRepositoryModule,
    MagicLinkCodeRepositoryModule,
    TermsRepositoryModule,
  ],
  providers: [AccountService, DiscordJSAdapter, JWTAdapter, SemVerAdapter],
})
export class AccountModule {}
