import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountRepositoryModule } from 'src/repositories/mongodb/account/account-repository.module';
import { JWTAdapter } from 'src/adapters/implementations/jwt.service';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { AuthController } from 'src/delivery/auth.controller';
import { MagicLinkCodeRepositoryModule } from 'src/repositories/mongodb/magic-lick-codes/magic-link-code-repository.module';
import { TermsRepositoryModule } from 'src/repositories/mongodb/terms/terms-repository.module';
import { SemVerAdapter } from 'src/adapters/implementations/semver.service';
import { StoreRepositoryModule } from 'src/repositories/mongodb/store/store-repository.module';
import { DocumentRepositoryModule } from 'src/repositories/mongodb/document/document-repository.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	controllers: [AuthController],
	imports: [
		AccountRepositoryModule,
		MagicLinkCodeRepositoryModule,
		TermsRepositoryModule,
		StoreRepositoryModule,
		DocumentRepositoryModule,
		NotificationModule,
	],
	providers: [AccountService, DiscordJSAdapter, JWTAdapter, SemVerAdapter],
})
export class AccountModule {}
