import type { INestApplication } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

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

  setupSwagger(app)

  await app.listen(5348)
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'REST API')
}

export function initRestApi() {
  bootstrap()
}
