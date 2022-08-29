import { ApiProperty } from '@nestjs/swagger'
import type {
  UserPublic,
  UserPrivate,
  PaginatedResponse,
  UserSessionData,
} from 'berta-snakes-shared'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { UserRole } from 'berta-snakes-shared'

export class UserPublicClass implements UserPublic {
  @ApiProperty()
  id!: number

  @ApiProperty()
  name!: string

  @ApiProperty()
  created!: number

  @ApiProperty()
  lastLogin!: number

  @ApiProperty({ enum: UserRole })
  role!: UserRole
}

export class UserPrivateClass extends UserPublicClass implements UserPrivate {
  @ApiProperty()
  email!: string

  @ApiProperty()
  confirmed!: boolean
}

export class UserPaginatedResponse implements PaginatedResponse<UserPublic> {
  @ApiProperty({ type: [UserPublicClass] })
  items!: UserPublicClass[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number
}

export class UserSessionDataClass implements UserSessionData {
  @ApiProperty()
  user!: UserPrivateClass

  @ApiProperty()
  accessToken!: string

  @ApiProperty()
  expires!: number
}
