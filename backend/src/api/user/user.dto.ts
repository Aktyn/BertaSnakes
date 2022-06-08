import { ApiProperty } from '@nestjs/swagger'
import type { CreateUserRequest } from 'berta-snakes-shared'
import { Config } from 'berta-snakes-shared'
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

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
