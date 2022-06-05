import { ApiProperty } from '@nestjs/swagger'
import { Config } from 'berta-snakes-shared'
import { IsString, MaxLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @MaxLength(Config.MAX_USER_NAME_LENGTH)
  @ApiProperty()
  readonly name!: string
}
