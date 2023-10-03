import { PlatformEnum } from 'src/types/enums/platform';
import { AccountEntity } from './account';

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
  account?: AccountEntity;
}

export interface NotificationUseCase {
  sendNotification: (i: SendNotificationInput) => Promise<void>;
}
