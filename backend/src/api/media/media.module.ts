import { Module } from '@nestjs/common'

import { DependencyPrismaModule } from '../../db/dependency-prisma.module'
import { DependencySessionModule } from '../session/dependency-session.module'

import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
  imports: [DependencySessionModule, DependencyPrismaModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
