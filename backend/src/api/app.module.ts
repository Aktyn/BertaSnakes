import { Module } from '@nestjs/common'

import { MongoDBModule } from '../db/mongodb.module'

import { UserModule } from './user/user.module'

@Module({
  imports: [MongoDBModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
