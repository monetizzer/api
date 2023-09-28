import type {
  AnyComponent,
  ButtonStyle,
  Channels,
  DiscordAdapter,
  Embed,
  SendMessageInput,
} from '../discord.js';
import { Injectable } from '@nestjs/common';
import fetch, { Response } from 'node-fetch';

interface ExchangeCodeAPIOutput {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface GetUserDataAPIOutput {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  banner?: string;
  bot: boolean;
  system: boolean;
  mfa_enabled: boolean;
  accent_color: number;
  locale: string;
  verified: boolean;
  email: string;
  flags: number;
  premium_type: number;
  public_flags: number;
}

interface GetUserDmChannelIdAPIOutput {
  id: string;
  // https://discord.com/developers/docs/resources/channel#channel-object
}

@Injectable()
export class DiscordJSAdapter implements DiscordAdapter {
  channels: Record<Channels, string> = {
    DOCUMENTS: '',
  };

  private readonly buttonStyles: Record<ButtonStyle, number> = {
    primary: 1,
    secondary: 2,
    success: 3,
    danger: 4,
    link: 5,
  };

  private discordApi: (route: string, init: RequestInit) => Promise<Response>;

  public constructor() {
    this.discordApi = (route: string, init: RequestInit) =>
      fetch(`https://discord.com/api/v10${route}`, init as any);
  }

  public async sendMessage({
    channelId,
    content,
    embeds,
    components,
  }: SendMessageInput) {
    let embedsFormatted;
    let componentsFormatted;

    if (embeds) {
      embedsFormatted = embeds.map(this.embedToDiscordEmbed);
    }

    if (components) {
      componentsFormatted = components.map(
        this.componentRowToDiscordComponentRow,
      );
    }

    await this.discordApi(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        embeds: embedsFormatted,
        components: componentsFormatted,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bot ${process.env['DISCORD_BOT_TOKEN']!}`,
      },
    });
  }

  public async exchangeCode(code: string) {
    const body = new URLSearchParams();
    body.append('client_id', process.env['DISCORD_BOT_CLIENT_ID']!);
    body.append('client_secret', process.env['DISCORD_BOT_CLIENT_SECRET']!);
    body.append('grant_type', 'authorization_code');
    body.append('code', code);
    body.append('redirect_uri', process.env['DISCORD_REDIRECT_URI']!);

    const result = await this.discordApi('/oauth2/token', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    })
      .then((r) => r.json())
      .then((r) => r as ExchangeCodeAPIOutput);

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      scopes: result.scope.split(' '),
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expiresAt: new Date(Date.now() + (result.expires_in - 60) * 1000),
    };
  }

  public async getUserData(discordId: string) {
    const result = await this.discordApi(`/users/${discordId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bot ${process.env['DISCORD_BOT_TOKEN']!}`,
      },
    })
      .then((r) => r.json())
      .then((r) => r as GetUserDataAPIOutput);

    return {
      id: result.id,
      username: this.getUsername(result.username, result.discriminator),
    };
  }

  public async getAuthenticatedUserData(accessToken: string) {
    const result = await this.discordApi(`/users/@me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => r.json())
      .then((r) => r as GetUserDataAPIOutput);

    return {
      id: result.id,
      email: result.email,
      username: this.getUsername(result.username, result.discriminator),
      verified: result.verified,
      avatarUrl: result.avatar
        ? this.getAvatarUrl(result.id, result.avatar)
        : undefined,
      bannerUrl: result.banner
        ? this.getBannerUrl(result.id, result.banner)
        : undefined,
    };
  }

  public async getUserDmChannelId(discordId: string) {
    const result = await this.discordApi(`/users/@me/channels`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_id: discordId,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${process.env['DISCORD_BOT_TOKEN']!}`,
      },
    })
      .then((r) => r.json())
      .then((r) => r as GetUserDmChannelIdAPIOutput);

    return result.id;
  }

  // Private

  private getUsername(username: string, discriminator: string) {
    if (discriminator === '0') {
      return username;
    }

    return `${username}#${discriminator}`;
  }

  private getAvatarUrl(discordId: string, hash: string) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${hash}?size=4096`;
  }

  private getBannerUrl(discordId: string, hash: string) {
    return `https://cdn.discordapp.com/banners/${discordId}/${hash}?size=4096`;
  }

  private getColorNumber(color: string) {
    return parseInt(color.replace('#', ''), 16);
  }

  private embedToDiscordEmbed(embed: Embed) {
    return {
      type: 'rich',
      title: embed.title,
      description: embed.description,
      url: embed.titleUrl,
      color: embed.color ? this.getColorNumber(embed.color) : undefined,
      timestamp: embed.timestamp ? embed.timestamp.toISOString() : undefined,
      footer: embed.footer
        ? {
            text: embed.footer.text,
            icon_url: embed.footer.iconUrl,
          }
        : undefined,
      author: embed.author
        ? {
            name: embed.author.name,
            icon_url: embed.author.iconUrl,
          }
        : undefined,
      image: embed.bannerUrl
        ? {
            url: embed.bannerUrl,
          }
        : undefined,
      thumbnail: embed.iconUrl
        ? {
            url: embed.iconUrl,
          }
        : undefined,
      fields: embed.fields ? embed.fields : undefined,
    };
  }

  private componentRowToDiscordComponentRow(
    componentsRow: Array<AnyComponent>,
  ) {
    return {
      type: 1,
      components: componentsRow.map((c) => ({
        type: 2,
        label: c.label,
        custom_id: c.customId,
        url: c.url,
        emoji: c.emoji
          ? {
              name: c.emoji,
            }
          : undefined,
        style: this.buttonStyles[c.style],
      })),
    };
  }
}
