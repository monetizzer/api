import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
} from '@nestjs/common';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import { UtilsAdapter } from 'src/adapters/implementations/utils.service';
import {
	CreateStoreInput,
	GetNewInput,
	StoreEntity,
	StoreUseCase,
	UpdateStoreInput,
} from 'src/models/store';
import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import { DocumentRepositoryService } from 'src/repositories/mongodb/document/document-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { DocumentStatusEnum } from 'src/types/enums/document-status';
import { PaginatedItems } from 'src/types/paginated-items';

@Injectable()
export class StoreService implements StoreUseCase {
	constructor(
		@Inject(StoreRepositoryService)
		private readonly storeRepository: StoreRepositoryService,
		@Inject(DocumentRepositoryService)
		private readonly documentRepository: DocumentRepositoryService,
		@Inject(AccountRepositoryService)
		private readonly accountRepository: AccountRepositoryService,
		private readonly fileAdapter: S3Adapter,
		private readonly utilsAdapter: UtilsAdapter,
	) {}

	async create({
		accountId,
		username,
		avatar,
		banner,
		...i
	}: CreateStoreInput): Promise<void> {
		const [store, document, storeUsername] = await Promise.all([
			this.storeRepository.getByAccountId({ accountId }),
			this.documentRepository.getByAccountId({ accountId }),
			this.storeRepository.getByUsername({ username }),
		]);

		if (store) {
			throw new ConflictException('You already has an store');
		}

		if (document?.status !== DocumentStatusEnum.AA) {
			throw new ForbiddenException('You must validate your documents first');
		}

		if (storeUsername) {
			throw new ConflictException(
				`There already exists an store with the username "${username}"`,
			);
		}

		const promises: Array<Promise<any>> = [
			this.accountRepository.updateUsername({
				accountId,
				username,
			}),
			this.storeRepository.create({
				...i,
				accountId,
				username,
				bannerUrl: banner
					? `${process.env['PUBLIC_FILES_URL']}/stores/banners/${accountId}.jpeg`
					: undefined,
				avatarUrl: avatar
					? `${process.env['PUBLIC_FILES_URL']}/stores/avatars/${accountId}.jpeg`
					: undefined,
			}),
		];

		if (avatar) {
			promises.push(
				this.fileAdapter.save({
					folder: process.env['PUBLIC_BUCKET_NAME'],
					filePath: `/stores/avatars/${accountId}.jpeg`,
					file: avatar,
				}),
			);
		}

		if (banner) {
			promises.push(
				this.fileAdapter.save({
					folder: process.env['PUBLIC_BUCKET_NAME'],
					filePath: `/stores/banners/${accountId}.jpeg`,
					file: banner,
				}),
			);
		}

		await Promise.all(promises);
	}

	async update({
		accountId,
		username,
		avatar,
		banner,
		...i
	}: UpdateStoreInput): Promise<void> {
		const userStore = await this.storeRepository.getByAccountId({ accountId });

		if (
			!userStore ||
			userStore.accountId !== accountId ||
			userStore.storeId !== i.storeId
		) {
			throw new BadRequestException('Invalid store');
		}

		if (username) {
			const storeByUsername = await this.storeRepository.getByUsername({
				username,
			});

			if (storeByUsername) {
				throw new ConflictException('Duplicated username');
			}
		}

		const promises: Array<Promise<any>> = [
			this.accountRepository.updateUsername({
				accountId,
				username,
			}),
			this.storeRepository.update({
				...i,
				username,
				bannerUrl: banner
					? `${process.env['PUBLIC_FILES_URL']}/stores/banners/${accountId}.jpeg`
					: undefined,
				avatarUrl: avatar
					? `${process.env['PUBLIC_FILES_URL']}/stores/avatars/${accountId}.jpeg`
					: undefined,
			}),
		];

		if (avatar) {
			promises.push(
				this.fileAdapter.save({
					folder: process.env['PUBLIC_BUCKET_NAME'],
					filePath: `/stores/avatars/${accountId}.jpeg`,
					file: avatar,
				}),
			);
		}

		if (banner) {
			promises.push(
				this.fileAdapter.save({
					folder: process.env['PUBLIC_BUCKET_NAME'],
					filePath: `/stores/banners/${accountId}.jpeg`,
					file: banner,
				}),
			);
		}

		await Promise.all(promises);
	}

	async getNew({
		page,
		limit: originalLimit,
	}: GetNewInput): Promise<PaginatedItems<StoreEntity>> {
		const { offset, limit, paging } = this.utilsAdapter.pagination({
			page,
			limit: originalLimit,
		});

		const stores = await this.storeRepository.getMany({
			limit,
			offset,
			orderBy: {
				createdAt: 'desc',
			},
		});

		return {
			paging,
			data: stores,
		};
	}
}
