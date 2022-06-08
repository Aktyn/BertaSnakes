import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateUserDto } from './user.dto'
import type { UserPublicClass } from './user.schema'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly appService: UserService) {}

  @Get()
  //@Query('id') id: string
  findAll(): Promise<UserPublicClass[]> {
    return this.appService.findAll()
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserPublicClass> {
    return this.appService.create(createUserDto)
  }
}
