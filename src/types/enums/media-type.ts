export enum MediaTypeEnum {
	AUDIO = 'AUDIO',
	VIDEO = 'VIDEO',
	IMAGE = 'IMAGE',
}

export const AUDIO_EXT = ['mp3'];
export const VIDEO_EXT = ['mp4'];
export const IMAGE_EXT = ['jpeg', 'jpg', 'png'];

export const ALL_MEDIA_EXT = [...AUDIO_EXT, ...VIDEO_EXT, ...IMAGE_EXT];
