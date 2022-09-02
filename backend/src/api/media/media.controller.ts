import { Controller, Get, Query } from '@nestjs/common'
import { ApiCreatedResponse, ApiQuery, ApiTags } from '@nestjs/swagger'
import type { SearchGalleryMediaRequest } from 'berta-snakes-shared'
import { Config, int } from 'berta-snakes-shared'

import {
  GalleryMediaOrderByClass,
  GalleryMediaPaginatedResponse,
} from './media.schema'
import { MediaService } from './media.service'

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  @ApiQuery({
    name: 'orderBy',
    type: GalleryMediaOrderByClass,
    required: false,
  })
  @Get()
  @ApiCreatedResponse({
    type: GalleryMediaPaginatedResponse,
    description: 'List of media matching given criteria',
  })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('orderBy') orderBy?: SearchGalleryMediaRequest['orderBy'],
  ) {
    return this.service.findAll(
      Math.max(0, int(page)),
      int(pageSize) || Config.TABLE.DEFAULT_PAGE_SIZE,
      { orderBy },
    )
  }
}
