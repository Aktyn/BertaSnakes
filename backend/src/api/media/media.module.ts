import { Module } from '@nestjs/common'

import { PrismaService } from '../../db/prisma.service'

import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
  imports: [],
  controllers: [MediaController],
  providers: [MediaService, PrismaService],
})
export class MediaModule {}
