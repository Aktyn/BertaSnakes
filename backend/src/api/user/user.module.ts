import { Module } from '@nestjs/common'

import { PrismaService } from '../../db/prisma.service'
import { EmailModule } from '../email/email.module'

import { SessionService } from './session.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [EmailModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, SessionService],
})
export class UserModule {}
