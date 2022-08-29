import type { WsResponse } from '@nestjs/websockets'
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway as NestJsWebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Observable, from } from 'rxjs'
import { map } from 'rxjs/operators'
import { Server } from 'socket.io'

@NestJsWebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'socket',
})
export class WebSocketGateway {
  @WebSocketServer()
  server!: Server

  @SubscribeMessage('events')
  findAll(@MessageBody() _data: unknown): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item })),
    )
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data
  }
}
