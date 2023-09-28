import { PlatformEnum } from 'src/types/enums/platform';

export interface NotificationEntity {
  notificationId: string;
  accountId: string;
  platform: PlatformEnum;
  title: string;
  description: string;
  data?: Record<string, string>;
  createdAt: Date;
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
  title: string;
  description: string;
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
  title: string;
  description: string;
  data?: Record<string, string>;
}

export interface TermsUseCase {
  sendNotification: (i: SendNotificationInput) => Promise<void>;
}
