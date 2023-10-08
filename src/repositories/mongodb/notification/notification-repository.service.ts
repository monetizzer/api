import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import {
	NotificationEntity,
	NotificationRepository,
	SaveInput,
} from 'src/models/notification';

interface NotificationTable extends Omit<NotificationEntity, 'notificationId'> {
	_id: string;
}

@Injectable()
export class NotificationRepositoryService implements NotificationRepository {
	constructor(
		@InjectRepository('notifications')
		private readonly notificationRepository: Repository<NotificationTable>,
		private readonly idAdapter: UIDAdapter,
	) {}

	async save({
		accountId,
		platform,
		templateId,
		data,
	}: SaveInput): Promise<void> {
		await this.notificationRepository.insertOne({
			_id: this.idAdapter.gen(),
			accountId,
			platform,
			templateId,
			data,
			createdAt: new Date(),
		});
	}
}
