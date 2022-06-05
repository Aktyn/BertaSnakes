import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateUserDto } from './user.dto'
import type { UserClass } from './user.schema'
import { documentToUserClass } from './user.schema'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly appService: UserService) {}

  @Get()
  //@Query('id') id: string
  findAll(): Promise<UserClass[]> {
    return this.appService
      .findAll()
      .then((users) => users.map(documentToUserClass))
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserClass> {
    const userDocument = await this.appService.create(createUserDto)
    return documentToUserClass(userDocument)
  }
}
