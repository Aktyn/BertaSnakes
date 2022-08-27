import { Module } from '@nestjs/common'

import { EmailModule } from '../email/email.module'

import { PrismaService } from './../../db/prisma.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [EmailModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule {}
