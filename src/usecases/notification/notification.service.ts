import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { SendMessageInput } from 'src/adapters/discord';
import { SendInput } from 'src/adapters/email';
import { DiscordJSAdapter } from 'src/adapters/implementations/discordjs.service';
import { SESAdapter } from 'src/adapters/implementations/ses.service';
import {
	TemplateEntity,
	NotificationUseCase,
	SendNotificationInput,
} from 'src/models/notification';
import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import { NotificationRepositoryService } from 'src/repositories/mongodb/notification/notification-repository.service';
import { PlatformEnum } from 'src/types/enums/platform';

interface BuildMessageInput {
	template: TemplateEntity;
	data: Record<string, string>;
}

// Temporary
const COLORS = {
	primary: '',
	secondary: '',
	success: '',
	error: '',
};

@Injectable()
export class NotificationService implements NotificationUseCase {
	defaultData: Record<string, string> = {
		frontEndUrl: process.env['FRONT_URL'],
	};

	private readonly templates: Record<string, TemplateEntity> = {
		MAGIC_LINK_LOGIN: {
			title: 'Seu link de login chegou!',
			email: {
				html: '{{frontEndUrl}}/auth/email?accountId={{accountId}}&code={{code}}',
			},
			discord: {
				description: 'Clique no botão abaixo para acessar sua conta.',
				color: COLORS.primary,
				link: {
					url: '{{frontEndUrl}}/auth/email?accountId={{accountId}}&code={{code}}',
					text: 'Entrar',
				},
			},
		},

		DOCUMENTS_APPROVED: {
			title: 'Parabés, seus documentos foram aprovados!',
			email: {
				html: 'Entre em nossa plataforma agora para continuar de onde você parou!',
			},
			discord: {
				description:
					'Entre em nossa plataforma agora para continuar de onde você parou!',
				color: COLORS.success,
			},
		},

		DOCUMENTS_REPROVED: {
			title: 'Que pena, seus documentos foram reprovados!',
			email: {
				html: 'Motivo: {{message}}<br/>Para resolver isso, corrija os problemas apontados e envie seus documentos novamente.',
			},
			discord: {
				description: [
					'Motivo:',
					'```',
					'{{message}}',
					'```',
					'',
					'Para resolver isso, corrija os problemas apontados e envie seus documentos novamente.',
				].join('\n'),
				color: COLORS.error,
			},
		},

		PRODUCT_APPROVED: {
			title: 'Parabés, seu produto foi aprovado!',
			email: {
				html: 'Entre em nossa plataforma agora para continuar de onde você parou!',
			},
			discord: {
				description:
					'Entre em nossa plataforma agora para continuar de onde você parou!',
				color: COLORS.success,
			},
		},

		PRODUCT_REPROVED: {
			title: 'Que pena, seu produto foi reprovado!',
			email: {
				html: 'Motivo: {{message}}<br/>Para resolver isso, corrija os problemas apontados e solicite a revisão novamente.',
			},
			discord: {
				description: [
					'Motivo:',
					'```',
					'{{message}}',
					'```',
					'',
					'Para resolver isso, corrija os problemas apontados e solicite a revisão novamente.',
				].join('\n'),
				color: COLORS.error,
			},
		},

		SALE_PAID: {
			title: 'Pagamento confirmado!',
			email: {
				html: 'Pagamento do pedido #{{saleId}} confirmado! Você já pode acessar os conteúdos.',
			},
			discord: {
				description:
					'Pagamento do pedido __#{{saleId}}__ confirmado! Você já pode acessar os conteúdos.',
				color: COLORS.success,
			},
		},

		WITHDRAW_COMPLETED: {
			title: 'Saque realizado com sucesso!',
			email: {
				html: 'Seu saque no valor de {{amount}} foi feito com sucesso e o comprovante de pagamento já está disponivel.',
			},
			discord: {
				description:
					'Seu saque no valor de {{amount}} foi feito com sucesso e o comprovante de pagamento já está disponivel.',
				color: COLORS.success,
			},
		},
	};

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
		templateId,
		data: dataWithoutDefault,
		account: maybeAccount,
	}: SendNotificationInput): Promise<void> {
		const template = this.templates[templateId];

		if (!template) {
			throw new InternalServerErrorException('Template not found');
		}

		const data = {
			accountId,
			...this.defaultData,
			...(dataWithoutDefault || {}),
		};

		const account = await (maybeAccount ||
			this.accountRepository.getByAccountId({ accountId }));

		if (!account) return;

		const promises: Array<Promise<any>> = [
			this.notificationRepository.save({
				accountId,
				platform: account.notifyThrough,
				templateId,
				data,
			}),
		];

		switch (account.notifyThrough) {
			case PlatformEnum.DISCORD: {
				promises.push(
					this.discordAdapter.sendMessage({
						channelId: account.discord!.dmChannelId!,
						...this.buildDiscordMessage({
							template,
							data,
						}),
					}),
				);

				break;
			}
			default: {
				promises.push(
					this.emailAdapter.send({
						from: process.env['NOTIFICATIONS_EMAIL'],
						to: account.email,
						...this.buildEmailMessage({
							template,
							data,
						}),
					}),
				);
			}
		}

		await Promise.all(promises);
	}

	// Private

	applyVariables(text: string, variables: Record<string, string>) {
		let formattedText = text;

		for (const key in variables) {
			const value = variables[key];

			formattedText = formattedText.replace(
				new RegExp(`{{${key}}}`, 'g'),
				value,
			);
		}

		return formattedText;
	}

	buildEmailMessage({
		template,
		data,
	}: BuildMessageInput): Omit<SendInput, 'from' | 'to'> {
		return {
			title: this.applyVariables(template.title, data),
			body: this.applyVariables(template.email.html, data),
		};
	}

	buildDiscordMessage({
		template,
		data,
	}: BuildMessageInput): Omit<SendMessageInput, 'channelId'> {
		return {
			embeds: [
				{
					title: this.applyVariables(template.title, data),
					description: this.applyVariables(template.discord.description, data),
					color: template.discord.color,
				},
			],
			components: template.discord.link
				? [
						[
							{
								style: 'link',
								url: this.applyVariables(template.discord.link.url, data),
								label: this.applyVariables(template.discord.link.text, data),
								emoji: template.discord.link.emoji,
							},
						],
				  ]
				: undefined,
		};
	}
}
