import type { INestApplication, OnModuleInit } from '@nestjs/common'
import { Logger, Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super()
    this.logger.log('PrismaService created')
  }

  async onModuleInit() {
    try {
      await this.$connect()
    } catch (err) {
      this.logger.error(err, undefined, 'DATABASE')
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }
}
