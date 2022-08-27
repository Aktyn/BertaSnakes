import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { int, Config } from 'berta-snakes-shared'

import { CreateUserDto } from './user.dto'
import type { UserPaginatedResponse, UserPrivateClass } from './user.schema'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'pageSize', type: Number, required: false })
  @ApiQuery({ name: 'name', type: String, required: false })
  @ApiQuery({ name: 'nameFragment', type: String, required: false })
  @ApiQuery({ name: 'email', type: String, required: false })
  @ApiQuery({ name: 'emailFragment', type: String, required: false })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('name') name?: string,
    @Query('nameFragment') nameFragment?: string,
    @Query('email') email?: string,
    @Query('emailFragment') emailFragment?: string,
  ): Promise<UserPaginatedResponse> {
    return this.service.findAll(
      int(page),
      int(pageSize) || Config.TABLE.DEFAULT_PAGE_SIZE,
      { name, nameFragment, email, emailFragment },
    )
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserPrivateClass> {
    try {
      return this.service.create(createUserDto)
    } catch (err) {
      if ((err as { code: number }).code === 11000) {
        throw new ConflictException()
      }
      throw err
    }
  }

  @Put('confirm-email')
  confirmEmail(
    @Query('confirmationCode') confirmationCode: string,
  ): Promise<UserPrivateClass> {
    return this.service.confirmEmail(confirmationCode)
  }
}
