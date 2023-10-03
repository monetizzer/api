import { Injectable } from '@nestjs/common';
import { FileAdapter, GetInput, SaveInput } from '../file';
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

@Injectable()
export class S3Adapter implements FileAdapter {
	private client: S3Client;

	constructor() {
		if (process.env['NODE_ENV'] === 'production') {
			this.client = new S3Client();
		} else {
			this.client = {} as S3Client;
		}
	}

	async save({ folder, filePath, file, metadata }: SaveInput) {
		if (process.env['NODE_ENV'] === 'production') {
			await this.client.send(
				new PutObjectCommand({
					Bucket: folder,
					Key: filePath,
					Body: file,
					Metadata: metadata,
				}),
			);

			return `${folder}${filePath}`;
		}

		const fileName = filePath.split('/').pop()!;
		const foldersToCreatePath = join(
			__dirname,
			'..',
			'..',
			'tmp',
			'assets',
			folder,
			filePath.replace(`/${fileName}`, ''),
		);
		mkdirSync(foldersToCreatePath, {
			recursive: true,
		});
		const path = join(__dirname, '..', '..', 'tmp', 'assets', folder, filePath);

		writeFileSync(path, file, { flag: 'w' });

		return `${folder}${filePath}`;
	}

	async getReadStream({ folder, filePath }: GetInput): Promise<Readable> {
		if (process.env['NODE_ENV'] === 'production') {
			const file = await this.client.send(
				new GetObjectCommand({
					Bucket: folder,
					Key: filePath,
				}),
			);

			return file.Body! as Readable;
		} else {
			return createReadStream(
				join(__dirname, '..', '..', 'tmp', 'assets', folder, filePath),
			);
		}
	}
}
