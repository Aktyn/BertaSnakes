import { Module } from '@nestjs/common'

import { DependencyPrismaModule } from '../../db/dependency-prisma.module'
import { EmailModule } from '../email/email.module'
import { DependencySessionModule } from '../session/dependency-session.module'

import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [EmailModule, DependencySessionModule, DependencyPrismaModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
