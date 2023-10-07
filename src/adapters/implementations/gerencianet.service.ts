import { Injectable } from '@nestjs/common';
import {
	GenPixInput,
	GenPixOutput,
	PaymentAdapter,
	RefundInput,
} from '../payment';
import fetch from 'node-fetch';
import { Agent } from 'https';

interface ApiCredentialsResponse {
	access_token: string;
	token_type: 'Bearer';
	expires_in: 3600;
	scope: string;
}

interface ApiCobResponse {
	calendario: {
		criacao: string;
		expiracao: number;
	};
	txid: string;
	revisao: number;
	loc: {
		id: number;
		location: string;
		tipoCob: string;
	};
	location: string;
	status: string;
	valor: {
		original: string;
	};
	chave: string;
}

interface ApiQrCodeResponse {
	qrcode: string;
	imagemQrcode: string; // Base64 image
}

@Injectable()
export class GerencianetAdapter implements PaymentAdapter {
	private httpsAgent: Agent;

	private readonly pixExpirationInSeconds = 900; // 15 min

	private readonly credentials: {
		accessToken: string;
		expiresAt: number;
	};

	constructor() {}

	async genPix({
		saleId,
		value: valueNumber,
	}: GenPixInput): Promise<GenPixOutput> {
		const fetcher = await this.getFetcher();

		const value = this.formatValue(valueNumber);

		const responseCob = await fetcher<ApiCobResponse>(`/v2/cob/${saleId}`, {
			method: 'PUT',
			body: JSON.stringify({
				calendario: {
					expiracao: this.pixExpirationInSeconds,
				},
				valor: {
					original: value,
				},
				chave: process.env['GERENCIANET_PIX_KEY'],
			}),
		});

		const responseQrCode = await fetcher<ApiQrCodeResponse>(
			`/v2/loc/${responseCob.loc.id}/qrcode`,
			{
				method: 'GET',
			},
		);

		return {
			code: responseQrCode.qrcode,
			qrCodeBase64: responseQrCode.imagemQrcode.replace(
				'data:image/png;base64,',
				'',
			),
		};
	}

	// TODO
	refund: (i: RefundInput) => Promise<void>;

	// Private

	private async getFetcher() {
		if (!this.httpsAgent) {
			this.httpsAgent = new Agent({
				rejectUnauthorized: true,
				cert: process.env['GERENCIANET_CERTIFICATE_CERT'],
				key: process.env['GERENCIANET_CERTIFICATE_KEY'],
			});
		}

		if (new Date().getTime() >= this.credentials.expiresAt) {
			const auth = Buffer.from(
				`${process.env['GERENCIANET_CLIENT_ID']}:${process.env['GERENCIANET_CLIENT_SECRET']}`,
			).toString('base64');

			const response = await fetch(
				`${process.env['GERENCIANET_URL']}$/oauth/token`,
				{
					method: 'POST',
					body: JSON.stringify({
						grant_type: 'client_credentials',
					}),
					agent: this.httpsAgent,
					headers: {
						Authorization: `Basic ${auth}`,
					},
				},
			).then((r) => r.json() as Promise<ApiCredentialsResponse>);

			this.credentials.accessToken = response.access_token;
			this.credentials.expiresAt =
				new Date().getTime() + response.expires_in - 150;
		}

		return <T>(url: string, options: RequestInit) =>
			fetch(`${process.env['GERENCIANET_URL']}${url}`, {
				...(options as any),
				agent: this.httpsAgent,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.credentials.accessToken}`,
				},
			}).then((r) => r.json() as Promise<T>);
	}

	private formatValue(valueNumber: number): string {
		const value = valueNumber.toString();

		const decimalsStart = value.length - 2;

		return [
			value.substring(0, decimalsStart),
			'.',
			value.substring(decimalsStart),
		].join('');
	}
}
