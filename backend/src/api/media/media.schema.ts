import { ApiProperty } from '@nestjs/swagger'
import type {
  GalleryMedia,
  PaginatedResponse,
  SearchGalleryMediaRequest,
} from 'berta-snakes-shared'

import { OrderByBaseClass } from '../../common/common.schema'
import { UserPublicClass } from '../user/user.schema'

export class GalleryMediaClass implements GalleryMedia {
  @ApiProperty()
  id!: number

  @ApiProperty()
  created!: number

  @ApiProperty()
  title!: string

  @ApiProperty()
  data!: string

  @ApiProperty()
  author!: UserPublicClass
}

export class GalleryMediaPaginatedResponse
  implements PaginatedResponse<GalleryMedia>
{
  @ApiProperty({ type: [GalleryMediaClass] })
  items!: GalleryMediaClass[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number
}

type T = Required<SearchGalleryMediaRequest>['orderBy']
export class GalleryMediaOrderByClass extends OrderByBaseClass implements T {
  @ApiProperty({
    enum: [
      'created',
    ] as Required<SearchGalleryMediaRequest>['orderBy']['key'][],
  })
  key!: 'created'
}
