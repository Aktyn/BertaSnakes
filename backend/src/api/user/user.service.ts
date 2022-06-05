import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import type { CreateUserDto } from './user.dto'
import type { UserDocument } from './user.schema'
import { UserClass } from './user.schema'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectModel(UserClass.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  findAll() {
    return this.userModel.find().exec()
  }

  async create(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto)
    const user = await createdUser.save()
    this.logger.log(`New user created {id: ${user._id}; name: ${user.name}}`)
    return user
  }
}
