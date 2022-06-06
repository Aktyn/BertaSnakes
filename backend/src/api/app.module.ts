import { Module } from '@nestjs/common'

import { MongoDBModule } from '../db/mongodb.module'

import { UserModule } from './user/user.module'
import { WebSocketModule } from './websocket/websocket.module'

@Module({
  imports: [MongoDBModule, WebSocketModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
