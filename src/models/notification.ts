import { PlatformEnum } from 'src/types/enums/platform';
import { AccountEntity } from './account';

export interface NotificationEntity {
	notificationId: string;
	accountId: string;
	platform: PlatformEnum;
	templateId: string;
	data?: Record<string, string>;
	createdAt: Date;
}

export interface TemplateEntity {
	title: string; // Title of email or message
	email: {
		html: string; // Email HTML body
	};
	discord: {
		description: string; // Embed description
		color: string; // Embed color
		// Button link
		link?: {
			url: string;
			text: string;
			emoji?: string;
		};
	};
}

/**
 *
 *
 * Repository
 *
 *
 */

export interface SaveInput {
	accountId: string;
	platform: PlatformEnum;
	templateId: string;
	data?: Record<string, string>;
}

export interface NotificationRepository {
	save: (i: SaveInput) => Promise<void>;
}

/**
 *
 *
 * Usecase
 *
 *
 */

export interface SendNotificationInput {
	accountId: string;
	templateId: string;
	data?: Record<string, string>;
	account?: AccountEntity;
}

export interface NotificationUseCase {
	sendNotification: (i: SendNotificationInput) => Promise<void>;
}
