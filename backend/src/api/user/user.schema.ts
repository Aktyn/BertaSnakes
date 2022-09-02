import { ApiProperty } from '@nestjs/swagger'
import type {
  UserPublic,
  UserPrivate,
  PaginatedResponse,
  UserSessionData,
  CreateUserRequest,
  EmailConfirmationRequest,
  LoginUserRequest,
  SetAvatarRequest,
} from 'berta-snakes-shared'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { UserRole, Config } from 'berta-snakes-shared'
import {
  IsBase64,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

import { IsNullable } from '../../common/validation'

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

  @ApiProperty()
  avatar!: string | null
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

export class CreateUserDto implements CreateUserRequest {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(Config.MAX_USER_NAME_LENGTH)
  readonly name!: string

  @ApiProperty()
  @IsEmail()
  readonly email!: string

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/\d/)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/[#?!@$%^&*-]/)
  readonly password!: string
}

export class LoginUserDto implements LoginUserRequest {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  readonly usernameOrEmail!: string

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/\d/)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/[#?!@$%^&*-]/)
  readonly password!: string
}

export class EmailConfirmationDto implements EmailConfirmationRequest {
  @ApiProperty()
  @IsString()
  @IsBase64()
  readonly confirmationCode!: string
}

export class SetAvatarDto implements SetAvatarRequest {
  @ApiProperty()
  @IsString()
  @IsBase64()
  @IsNullable()
  readonly base64!: string
}
