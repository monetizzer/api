/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, FileValidator } from '@nestjs/common';

interface FileSizeValidationPipeParams {
	minSize?: number;
	maxSize: number;
}

interface FileData {
	[propName: string]: Array<{
		fieldName: string;
		originalName: string;
		encoding: string;
		mimetype: string;
		size: number;
	}>;
}

@Injectable()
export class FileSizeValidationPipe extends FileValidator<Record<string, any>> {
	constructor(
		protected readonly validationOptions: FileSizeValidationPipeParams,
	) {
		super(validationOptions);
	}

	// "value" is an object containing the file's attributes and metadata
	isValid(file?: FileData): boolean {
		const files = Object.values(file).flat();

		for (const file of files) {
			if (
				this.validationOptions.minSize &&
				(file.size < this.validationOptions.minSize ||
					file.size > this.validationOptions.maxSize)
			) {
				return false;
			}

			if (file.size > this.validationOptions.maxSize) {
				return false;
			}
		}

		return true;
	}

	buildErrorMessage(file: FileData): string {
		if (this.validationOptions.minSize) {
			return `Validation failed (expected size is between ${this.validationOptions.minSize} and ${this.validationOptions.maxSize})`;
		}

		return `Validation failed (expected size is less than ${this.validationOptions.maxSize})`;
	}
}

interface FileTypeValidationPipeParams {
	regex: RegExp;
}

@Injectable()
export class FileTypeValidationPipe extends FileValidator<Record<string, any>> {
	constructor(
		protected readonly validationOptions: FileTypeValidationPipeParams,
	) {
		super(validationOptions);
	}

	// "value" is an object containing the file's attributes and metadata
	isValid(file?: FileData): boolean {
		const files = Object.values(file).flat();

		for (const file of files) {
			if (!this.validationOptions.regex.test(file.mimetype)) {
				return false;
			}
		}

		return true;
	}

	buildErrorMessage(file: FileData): string {
		return `Validation failed (expected mimetype to match ${this.validationOptions.regex.source})`;
	}
}
