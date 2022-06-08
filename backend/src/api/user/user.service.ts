import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { UserPublic } from 'berta-snakes-shared'
import type { Document } from 'mongoose'
import mongoose, { Model } from 'mongoose'

import { sha256 } from '../../common/crypto'

import type { CreateUserDto } from './user.dto'
import type { UserPrivateClass } from './user.schema'

type UserDocument = Omit<UserPrivateClass, 'id'> & Document

function documentToUserPublicClass(document: UserDocument): UserPublic {
  return {
    id: document._id,
    name: document.name,
    created: new mongoose.Types.ObjectId(document._id).getTimestamp().getTime(),
  }
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectModel('users')
    private readonly userModel: Model<UserDocument>,
  ) {}

  findAll() {
    return this.userModel
      .find()
      .exec()
      .then((documents) => documents.map(documentToUserPublicClass))
  }

  async create(createUserDto: CreateUserDto) {
    const userData = {
      name: createUserDto.name,
      email: createUserDto.email,
      password: sha256(createUserDto.password),
      confirmed: false,
    }
    const createdUser = new this.userModel(userData)
    const user = await createdUser.save()
    this.logger.log(`New user created {id: ${user._id}; name: ${user.name}}`)
    return documentToUserPublicClass(user)
  }
}
