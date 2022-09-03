import { Module } from '@nestjs/common'

// import { EmailModule } from './email/email.module'
import { MediaModule } from './media/media.module'
import { UserModule } from './user/user.module'
import { WebSocketModule } from './websocket/websocket.module'

@Module({
  imports: [WebSocketModule, UserModule, MediaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
