import type { INestApplication } from '@nestjs/common'
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
  })

  setupSwagger(app)

  await app.listen(5348)
  // eslint-disable-next-line no-console
  console.log(`Application is running on: ${await app.getUrl()}`)
}

export function initRestApi() {
  bootstrap()
}
