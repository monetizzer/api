import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { StoreService } from 'src/usecases/store/store.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateDto, UpdateDto } from './dtos/store';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('/')
  @UseGuards(AuthGuard(['USER']))
  create(
    @Body()
    body: CreateDto,
    @AccountId()
    accountId: string,
  ) {
    return this.storeService.create({ accountId, ...body });
  }

  @Patch('/')
  @UseGuards(AuthGuard(['USER']))
  update(
    @Body()
    body: UpdateDto,
    @AccountId()
    accountId: string,
  ) {
    return this.storeService.update({ accountId, ...body });
  }
}
