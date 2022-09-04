import { Body, Controller, Delete, Get, Post, Query, Req } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import type { SearchGalleryMediaRequest } from 'berta-snakes-shared'
import { Config, int } from 'berta-snakes-shared'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { Request as ExpressRequest } from 'express'

import { SuccessResponseClass } from '../../common/common.schema'
import { retrieveAccessToken } from '../../common/rest'

import {
  GalleryMediaPaginatedResponse,
  SubmitGalleryMediaDto,
} from './media.schema'
import { MediaService } from './media.service'

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  @ApiQuery({
    name: 'sortKey',
    enum: ['created'] as Required<SearchGalleryMediaRequest>['sortKey'][],
    required: false,
  })
  @ApiQuery({
    name: 'sortDirection',
    enum: ['asc', 'desc'],
    example: 'asc',
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
    @Query('sortKey') sortKey?: SearchGalleryMediaRequest['sortKey'],
    @Query('sortDirection')
    sortDirection?: SearchGalleryMediaRequest['sortDirection'],
  ) {
    return this.service.findAll(
      Math.max(0, int(page)),
      int(pageSize) || Config.TABLE.DEFAULT_PAGE_SIZE,
      { sortKey, sortDirection },
    )
  }

  @ApiBearerAuth('Bearer')
  @Post()
  @ApiCreatedResponse({
    type: SuccessResponseClass,
    description: 'Information whether request was successful',
  })
  submitMedia(
    @Body() submitGalleryMediaDto: SubmitGalleryMediaDto,
    @Req() request: ExpressRequest,
  ) {
    return this.service.addMedia(
      submitGalleryMediaDto,
      retrieveAccessToken(request),
    )
  }

  @ApiBearerAuth('Bearer')
  @ApiQuery({ name: 'id', type: Number, required: false })
  @Delete()
  @ApiCreatedResponse({
    type: SuccessResponseClass,
    description: 'Information whether request was successful',
  })
  deleteMedia(@Query('id') id: number, @Req() request: ExpressRequest) {
    return this.service.deleteMedia(int(id), retrieveAccessToken(request))
  }
}
