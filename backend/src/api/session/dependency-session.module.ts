import { Module } from '@nestjs/common'

import { DependencyPrismaModule } from '../../db/dependency-prisma.module'

import { SessionService } from './session.service'

@Module({
  imports: [DependencyPrismaModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class DependencySessionModule {}
