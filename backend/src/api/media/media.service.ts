import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import type { Media, Prisma, User } from '@prisma/client'
import type {
  GalleryMedia,
  PaginatedResponse,
  SearchGalleryMediaRequest,
  SubmitGalleryMediaRequest,
  SuccessResponse,
  UserPublic,
} from 'berta-snakes-shared'
import { pick, ErrorCode } from 'berta-snakes-shared'

import { PrismaService } from '../../db/prisma.service'
import { SessionService } from '../session/session.service'
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
  [key in Required<SearchGalleryMediaRequest>['sortKey']]: keyof Prisma.MediaOrderByWithRelationInput
} = {
  created: 'created',
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name)

  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {}

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
        orderBy: searchParameters.sortKey
          ? {
              [orderByKeysMapping[searchParameters.sortKey]]:
                searchParameters.sortDirection ?? 'asc',
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

  async addMedia(
    request: SubmitGalleryMediaRequest,
    accessToken: string,
  ): Promise<SuccessResponse> {
    const session = this.sessionService.getSession(accessToken)

    await this.prisma.media.create({
      data: {
        created: Date.now(),
        title: request.title,
        data: Buffer.from(request.data, 'base64'),
        userId: session.userId,
      },
    })

    return { success: true }
  }

  async deleteMedia(id: number, accessToken: string): Promise<SuccessResponse> {
    const session = this.sessionService.getSession(accessToken)

    //_session.role
    //TODO: check if user has proper permissions to perform this action

    await this.prisma.media.delete({
      where: {
        id,
      },
    })

    this.logger.log(`User ${session.userId} deleted media ${id}`)

    return { success: true }
  }
}
