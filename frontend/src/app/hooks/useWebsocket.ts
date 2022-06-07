import { useEffect, useState } from 'react'
import type { WebsocketSubscription } from '../../services/websocket.service'
import websocketService from '../../services/websocket.service'

export function useWebsocket() {
  const [connected, setConnected] = useState(websocketService.connected)

  useEffect(() => {
    const subscription: WebsocketSubscription = {
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    }

    websocketService.registerSubscription(subscription)

    return () => {
      websocketService.unregisterSubscription(subscription)
    }
  }, [])

  return { connected }
}
