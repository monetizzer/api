import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import { CreateInput, GetManyInput } from 'src/models/content';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { Filter } from 'mongodb';
import { ContentEntity, ContentRepository } from 'src/models/content';

interface ContentTable extends Omit<ContentEntity, 'contentId'> {
	_id: string;
}

@Injectable()
export class ContentRepositoryService implements ContentRepository {
	constructor(
		@InjectRepository('contents')
		private readonly contentRepository: Repository<ContentTable>,
		private readonly idAdapter: UIDAdapter,
	) {}

	async create({ contentId, ...i }: CreateInput): Promise<void> {
		await this.contentRepository.insertOne({
			...i,
			_id: contentId,
			createdAt: new Date(),
		});
	}

	async getMany({ productId }: GetManyInput): Promise<ContentEntity[]> {
		const filters: Filter<ContentTable> = {};

		if (productId) {
			filters.productId = productId;
		}

		const contentsCursor = this.contentRepository.find(filters);
		const contents = await contentsCursor.toArray();

		return contents.map((content) => {
			const { _id, ...contentData } = content;

			return {
				...contentData,
				contentId: _id,
			};
		});
	}
}
