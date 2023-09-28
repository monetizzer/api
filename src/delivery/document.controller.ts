import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DocumentService } from 'src/usecases/document/document.service';
import { AccountId } from './decorators/account-id';
import { AuthGuard } from './guards/auth.guard';
import { CreateCompleteDto, ReviewDto } from './dtos/document';
import { AdminGuard } from './guards/admin.guard';

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

  @Get('status')
  @UseGuards(AuthGuard(['USER']))
  status(
    @AccountId()
    accountId: string,
  ) {
    return this.documentService.status({ accountId });
  }

  @Get('review')
  @UseGuards(AdminGuard)
  getToReview() {
    return this.documentService.getToReview();
  }

  @Get(':folder/:type/:name')
  @UseGuards(AdminGuard)
  getImage(
    @Param('folder')
    folder: string,
    @Param('type')
    type: string,
    @Param('name')
    name: string,
  ) {
    return this.documentService.getImage({
      folder,
      type,
      name,
    });
  }

  @Post('review')
  @UseGuards(AdminGuard)
  review(
    @Body()
    body: ReviewDto,
    @AccountId()
    reviewerId: string,
  ) {
    return this.documentService.review({ reviewerId, ...body });
  }
}
