import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { S3Adapter } from 'src/adapters/implementations/s3.service';
import {
	CreateStoreInput,
	StoreUseCase,
	UpdateStoreInput,
} from 'src/models/store';
import { AccountRepositoryService } from 'src/repositories/mongodb/account/account-repository.service';
import { DocumentRepositoryService } from 'src/repositories/mongodb/document/document-repository.service';
import { StoreRepositoryService } from 'src/repositories/mongodb/store/store-repository.service';
import { DocumentStatusEnum } from 'src/types/enums/document-status';

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
			throw new HttpException('You already has an store', HttpStatus.CONFLICT);
		}

		if (document?.status !== DocumentStatusEnum.AA) {
			throw new HttpException(
				'You must validate your documents first',
				HttpStatus.FORBIDDEN,
			);
		}

		if (storeUsername) {
			throw new HttpException(
				`There already exists an store with the username "${username}"`,
				HttpStatus.CONFLICT,
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
					folder: 'stores',
					filePath: `/avatars/${accountId}.jpeg`,
					file: avatar,
				}),
			);
		}

		if (banner) {
			promises.push(
				this.fileAdapter.save({
					folder: 'stores',
					filePath: `/banners/${accountId}.jpeg`,
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
			throw new HttpException('Invalid store', HttpStatus.BAD_REQUEST);
		}

		if (username) {
			const storeByUsername = await this.storeRepository.getByUsername({
				username,
			});

			if (storeByUsername) {
				throw new HttpException('Duplicated username', HttpStatus.CONFLICT);
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
					folder: 'stores',
					filePath: `/avatars/${accountId}.jpeg`,
					file: avatar,
				}),
			);
		}

		if (banner) {
			promises.push(
				this.fileAdapter.save({
					folder: 'stores',
					filePath: `/banners/${accountId}.jpeg`,
					file: banner,
				}),
			);
		}

		await Promise.all(promises);
	}
}
