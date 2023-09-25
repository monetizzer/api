import { Test, TestingModule } from '@nestjs/testing';
import { AccountRepositoryService } from '../../../src/repositories/mongodb/account/account-repository.service';

describe('AccountRepositoryService', () => {
  let service: AccountRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountRepositoryService],
    }).compile();

    service = module.get<AccountRepositoryService>(AccountRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
