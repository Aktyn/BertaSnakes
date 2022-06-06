import assert from 'assert'

import { MongooseModule } from '@nestjs/mongoose'
import { Config } from 'berta-snakes-shared'

assert(
  typeof process.env.MONGODB_URI === 'string',
  'MONGODB_URI must be set in .env',
)

export const MongoDBModule = MongooseModule.forRootAsync({
  useFactory: () => {
    return {
      uri: process.env.MONGODB_URI,
      dbName: Config.DATABASE_NAME,
    }
  },
})
