import { Column, ObjectIdColumn } from 'typeorm';

export class AccountEntity {
  @ObjectIdColumn({
    type: 'uuid',
  })
  public accountId: string;

  @Column()
  public isAdmin?: boolean;

  @Column()
  public lastTermsAccepted?: string;

  @Column()
  public userName: string;

  @Column()
  public email: string;

  @Column()
  public discordId?: string;

  @Column(() => DiscordSettingsSubEntity)
  discord?: DiscordSettingsSubEntity;

  @Column()
  public createdAt: Date;
}

export class DiscordSettingsSubEntity {
  @Column()
  public userName: string;
}
