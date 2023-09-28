import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DocumentService } from 'src/usecases/document/document.service';
import { AccountId } from './decorators/accountid';
import { AuthGuard } from './guards/auth.guard';
import { CreateCompleteDto } from './dtos/document';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('complete')
  @UseGuards(AuthGuard(['USER']))
  createComplete(
    @Body()
    body: CreateCompleteDto,
    @AccountId()
    accountId: string,
  ) {
    return this.documentService.createComplete({ accountId, ...body });
  }
}