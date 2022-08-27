import { ApiProperty } from '@nestjs/swagger'
import type {
  UserPublic,
  UserPrivate,
  PaginatedResponse,
} from 'berta-snakes-shared'

export class UserPublicClass implements UserPublic {
  @ApiProperty()
  id!: number

  @ApiProperty()
  name!: string

  @ApiProperty({ type: Number, required: true })
  created!: number
}

export class UserPrivateClass extends UserPublicClass implements UserPrivate {
  @ApiProperty()
  email!: string

  @ApiProperty()
  confirmed!: boolean
}

export class UserPaginatedResponse implements PaginatedResponse<UserPublic> {
  @ApiProperty({ type: [UserPublicClass], required: true })
  items!: UserPublicClass[]

  @ApiProperty({ type: Number, required: true })
  page!: number

  @ApiProperty({ type: Number, required: true })
  pageSize!: number

  @ApiProperty({ type: Number, required: true })
  total!: number
}
