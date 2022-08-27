import type { INestApplication } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { PrismaService } from 'db/prisma.service'

import { AppModule } from './app.module'

function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Berta Snakes REST API')
    .setDescription('---')
    .setVersion('2.0.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
    cors: true,
  })
  app.setGlobalPrefix('api')

  setupSwagger(app)

  await app.listen(5348)
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'REST API')

  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)
}

export function initRestApi() {
  bootstrap()
}
