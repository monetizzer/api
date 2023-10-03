export enum DocumentStatusEnum {
	'00' = '00',
	'V0' = 'V0',
	'R0' = 'R0',
	'A0' = 'A0',
	'AV' = 'AV',
	'VV' = 'VV',
	'VR' = 'VR',
	'RR' = 'RR',
	'AR' = 'AR',
	'AA' = 'AA',
}

interface CanChangeStatusInput {
	oldStatus?: DocumentStatusEnum;
	newStatus: DocumentStatusEnum;
}

export const canChangeStatus = ({
	oldStatus,
	newStatus,
}: CanChangeStatusInput): boolean => {
	switch (oldStatus) {
		case DocumentStatusEnum['00']:
		default: {
			return [DocumentStatusEnum.V0, DocumentStatusEnum.VV].includes(newStatus);
		}

		case DocumentStatusEnum.V0: {
			return [DocumentStatusEnum.A0, DocumentStatusEnum.VV].includes(newStatus);
		}

		case DocumentStatusEnum.R0: {
			return [DocumentStatusEnum.V0, DocumentStatusEnum.VV].includes(newStatus);
		}

		case DocumentStatusEnum.A0: {
			return [DocumentStatusEnum.AV].includes(newStatus);
		}

		case DocumentStatusEnum.VV: {
			return [DocumentStatusEnum.AA, DocumentStatusEnum.RR].includes(newStatus);
		}

		case DocumentStatusEnum.VR: {
			return [DocumentStatusEnum.RR, DocumentStatusEnum.VV].includes(newStatus);
		}

		case DocumentStatusEnum.RR: {
			return [DocumentStatusEnum.VV].includes(newStatus);
		}

		case DocumentStatusEnum.AR: {
			return [DocumentStatusEnum.AV].includes(newStatus);
		}

		case DocumentStatusEnum.AA: {
			return false;
		}
	}
};
