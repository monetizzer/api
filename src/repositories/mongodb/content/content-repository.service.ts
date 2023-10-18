import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
	CreateInput,
	GetManyInput,
	GetMediasCountInput,
} from 'src/models/content';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { Filter } from 'mongodb';
import { ContentEntity, ContentRepository } from 'src/models/content';
import { ProductMediasCount } from 'src/models/product';

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

	async getMany({
		productId,
		limit,
		offset,
	}: GetManyInput): Promise<ContentEntity[]> {
		const filters: Filter<ContentTable> = {};

		if (productId) {
			filters.productId = productId;
		}

		const contentsCursor = this.contentRepository.find(filters, {
			limit,
			skip: offset,
		});
		const contents = await contentsCursor.toArray();

		return contents.map((content) => {
			const { _id, ...contentData } = content;

			return {
				...contentData,
				contentId: _id,
			};
		});
	}

	async getMediasCount({
		productId,
	}: GetMediasCountInput): Promise<ProductMediasCount> {
		const contentsCursor = this.contentRepository.find(
			{
				productId,
			},
			{
				projection: {
					type: true,
				},
			},
		);
		const contents = await contentsCursor.toArray();

		return contents.reduce((acc, cur) => {
			const { type } = cur;

			if (!acc[type]) {
				acc[type] = 0;
			}

			acc[type]++;

			return acc;
		}, {} as ProductMediasCount);
	}
}
