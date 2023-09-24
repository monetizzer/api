import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '..';
import {
  AccountEntity,
  AccountRepository,
  CreateInput,
  GetByAccountIdInput,
  GetManyByDiscordInput,
  GetByEmailInput,
  UpdateDiscordInput,
} from 'src/models/account';
import { UIDAdapter } from 'src/adapters/implementations/uid.service';
import { Filter } from 'mongodb';

interface AccountTable extends Omit<AccountEntity, 'accountId'> {
  _id: string;
}

@Injectable()
export class AccountRepositoryService implements AccountRepository {
  constructor(
    @InjectRepository('accounts')
    private readonly accountRepository: Repository<AccountTable>,
    private readonly idAdapter: UIDAdapter,
  ) {}

  async create(i: CreateInput): Promise<AccountEntity> {
    const accountId = this.idAdapter.gen();
    const username = this.genUsername();

    const account = {
      ...i,
      username,
      createdAt: new Date(),
    };

    await this.accountRepository.insertOne({
      ...account,
      _id: accountId,
      username,
      createdAt: new Date(),
    });

    return {
      ...account,
      accountId,
    };
  }

  async updateDiscord({ accountId, ...i }: UpdateDiscordInput): Promise<void> {
    await this.accountRepository.updateOne(
      {
        _id: accountId,
      },
      i,
    );
  }

  async getByAccountId({
    accountId,
  }: GetByAccountIdInput): Promise<void | AccountEntity> {
    const account = await this.accountRepository.findOne({
      _id: accountId,
    });

    if (!account) return;

    const { _id, ...accountData } = account;

    return {
      ...accountData,
      accountId: _id,
    };
  }

  async getByEmail({ email }: GetByEmailInput): Promise<void | AccountEntity> {
    const account = await this.accountRepository.findOne({
      email: email,
    });

    if (!account) return;

    const { _id, ...accountData } = account;

    return {
      ...accountData,
      accountId: _id,
    };
  }

  async getManyByDiscord({
    discordId,
    email,
  }: GetManyByDiscordInput): Promise<Array<AccountEntity>> {
    const conditions = [
      {
        discordId,
      },
    ] as Array<Filter<AccountTable>>;

    if (email) {
      conditions.push({
        email,
      });
    }

    const accountsCursor = await this.accountRepository.find({
      $or: conditions,
    });
    const accounts = await accountsCursor.toArray();

    if (accounts.length <= 0) return [] as Array<AccountEntity>;

    return accounts.map((a) => {
      const { _id, ...accountData } = a;

      return {
        ...accountData,
        accountId: _id,
      };
    });
  }

  private genUsername() {
    const amountOfNumbers = 8;

    return `user${Math.random() * Math.pow(10, amountOfNumbers)}`;
  }
}
