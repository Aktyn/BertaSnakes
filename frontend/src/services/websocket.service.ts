import assert from 'assert'
import { io } from 'socket.io-client'

assert(
  typeof process.env.REACT_APP_WEBSOCKET_URL === 'string',
  'REACT_APP_WEBSOCKET_URL is not set',
)

const socketUrl = process.env.REACT_APP_WEBSOCKET_URL

export interface WebsocketSubscription {
  onConnect?: () => void
  onDisconnect?: () => void
  // onEvent: (data: any) => void
}

class WebsocketService {
  private readonly socket = io(socketUrl)
  private readonly subscriptions: WebsocketSubscription[] = []

  constructor() {
    this.socket.on('connect', () => {
      // console.log('Connected')
      // this.socket.volatile.emit('events', { test: 'test' })
      // this.socket.volatile.emit('identity', 0, (response: number) =>
      //   console.log('Identity:', response),
      // )
      for (const subscription of this.subscriptions) {
        subscription.onConnect?.()
      }
    })
    // this.socket.on('events', function (data) {
    //   console.log('event', data)
    // })
    // this.socket.on('exception', function (data) {
    //   console.log('exception event', data)
    // })
    this.socket.on('disconnect', () => {
      for (const subscription of this.subscriptions) {
        subscription.onDisconnect?.()
      }
    })
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect()
    }
  }

  disconnect() {
    this.socket.disconnect()
  }

  get connected() {
    return this.socket.connected
  }

  registerSubscription(subscription: WebsocketSubscription) {
    if (!this.subscriptions.includes(subscription)) {
      this.subscriptions.push(subscription)
    }
  }

  unregisterSubscription(subscription: WebsocketSubscription) {
    const index = this.subscriptions.indexOf(subscription)
    if (index !== -1) {
      this.subscriptions.splice(index, 1)
    }
  }
}

export default new WebsocketService()
