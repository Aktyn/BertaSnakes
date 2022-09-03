import { ApiProperty } from '@nestjs/swagger'
import type {
  GalleryMedia,
  PaginatedResponse,
  SubmitGalleryMediaRequest,
} from 'berta-snakes-shared'
import { IsBase64, IsString } from 'class-validator'

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

export class SubmitGalleryMediaDto implements SubmitGalleryMediaRequest {
  @ApiProperty()
  @IsString()
  readonly title!: string

  @ApiProperty()
  @IsString()
  @IsBase64()
  readonly data!: string
}
