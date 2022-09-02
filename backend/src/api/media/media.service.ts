import { Injectable, InternalServerErrorException } from '@nestjs/common'
import type { Media, Prisma, User } from '@prisma/client'
import type {
  GalleryMedia,
  PaginatedResponse,
  SearchGalleryMediaRequest,
  UserPublic,
} from 'berta-snakes-shared'
import { pick, ErrorCode } from 'berta-snakes-shared'

import { PrismaService } from '../../db/prisma.service'
import { parseToUserPublic, selectUserPublic } from '../user/user.service'

const parseToGalleryMedia = (data: {
  [key in keyof GalleryMedia]: (Media & {
    author: { [key in keyof UserPublic]: User[key] } | null
  })[key]
}): GalleryMedia => ({
  ...pick(data, 'id', 'title'),
  data: data.data?.toString('base64') ?? null,
  created: Number(data.created),
  author: data.author && parseToUserPublic(data.author),
})

const selectGalleryMediaPublic: {
  [key in keyof Omit<GalleryMedia, 'author'>]: true
} & {
  author: { select: typeof selectUserPublic }
} = {
  id: true,
  created: true,
  title: true,
  data: true,
  author: { select: selectUserPublic },
}

const orderByKeysMapping: {
  [key in Required<SearchGalleryMediaRequest>['orderBy']['key']]: keyof Prisma.MediaOrderByWithRelationInput
} = {
  created: 'created',
}

@Injectable()
export class MediaService {
  // private readonly logger = new Logger(MediaService.name)

  constructor(private prisma: PrismaService) {}

  async findAll(
    page: number,
    pageSize: number,
    searchParameters: SearchGalleryMediaRequest,
  ): Promise<PaginatedResponse<GalleryMedia>> {
    const conditions: Prisma.MediaWhereInput = {}

    const results = await this.prisma.$transaction([
      this.prisma.media.count({ where: conditions }),
      this.prisma.media.findMany({
        skip: page * pageSize,
        take: pageSize,
        where: conditions,
        orderBy: searchParameters.orderBy
          ? {
              [orderByKeysMapping[searchParameters.orderBy.key]]:
                searchParameters.orderBy.direction ?? 'desc',
            }
          : undefined,
        select: selectGalleryMediaPublic,
      }),
    ])

    if (results.length !== 2) {
      throw new InternalServerErrorException({
        error: ErrorCode.DATABASE_SEARCH_ERROR,
      })
    }

    return {
      items: results[1].map((row) => parseToGalleryMedia(row)),
      page,
      pageSize,
      total: results[0],
    }
  }
}
