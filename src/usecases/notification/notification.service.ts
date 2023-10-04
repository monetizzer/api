import { Inject, Injectable } from '@nestjs/common';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { SESAdapter } from 'src/adapters/implementations/ses.service';
import {
	NotificationUseCase,
	SendNotificationInput,
} from 'src/models/notification';
import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import { NotificationRepositoryService } from 'src/repositories/mongodb/notification/notification-repository.service';
import { PlatformEnum } from 'src/types/enums/platform';

@Injectable()
export class NotificationService implements NotificationUseCase {
	constructor(
		@Inject(NotificationRepositoryService)
		private readonly notificationRepository: NotificationRepositoryService,
		@Inject(AccountRepositoryService)
		private readonly accountRepository: AccountRepositoryService,
		private readonly emailAdapter: SESAdapter,
		private readonly discordAdapter: DiscordJSAdapter,
	) {}

	async sendNotification({
		accountId,
		title,
		description,
		data,
		account: maybeAccount,
	}: SendNotificationInput): Promise<void> {
		const account = await (maybeAccount ||
			this.accountRepository.getByAccountId({ accountId }));

		if (!account) return;

		const promises: Array<Promise<any>> = [
			this.notificationRepository.save({
				accountId,
				platform: account.notifyThrough,
				title,
				description,
				data,
			}),
		];

		switch (account.notifyThrough) {
			case PlatformEnum.DISCORD: {
				const { color, ...d } = data || {};

				promises.push(
					this.discordAdapter.sendMessage({
						channelId: account.discord!.dmChannelId!,
						embeds: [
							{
								title,
								description,
								fields: Object.entries(d).map(([key, value]) => ({
									name: key,
									value,
									inline: true,
								})),
								color,
							},
						],
					}),
				);

				break;
			}
			default: {
				promises.push(
					this.emailAdapter.send({
						from: process.env['NOTIFICATIONS_EMAIL'],
						to: account.email,
						title,
						body: description,
					}),
				);
			}
		}

		await Promise.all(promises);
	}
}
