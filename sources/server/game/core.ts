import Connections, { Connection } from './connections'
import { Server } from 'ws'
import { handleByteBuffer, handleJSON, onDisconnect } from './message_handler'

let open_port = 0 //can be initialized to zero since it is falsy value

function onMessage(connection: Connection, message: any) {
  try {
    if (typeof message === 'string')
      //stringified JSON object
      handleJSON(connection, JSON.parse(message)).catch(console.error)
    else if (typeof message === 'object')
      //object - probably array buffer
      handleByteBuffer(connection, message)
    else console.error('Message must by type of string or object')
  } catch (e) {
    console.log('Message handle error: ', e)
  }
}

export default {
  runAt(port: number) {
    //port for websocket server
    if (open_port)
      throw new Error('WebSocketServer is already open at port: ' + open_port)
    open_port = port

    console.log('Running WebSocketServer at port:', port)

    const websocket = new Server({ port })

    websocket.on('connection', function (ws, req) {
      ;(<any>ws).isAlive = true
      ws.on('pong', () => {
        ;(<any>ws).isAlive = true //heartbeat
      })

      //new client's connection
      let connection = Connections.add(ws, req)

      ws.on('message', function (message) {
        onMessage(connection, message)
      })

      ws.on('close', () => {
        // close user connection
        console.log('connection close:', connection.id)
        onDisconnect(connection)
        Connections.remove(connection)
      })
    })

    //detecting dead connections
    setInterval(function ping() {
      websocket.clients.forEach((ws) => {
        if ((<any>ws).isAlive === false) {
          //connection doesn't send pong in time
          console.log('removing dead connection')
          return ws.terminate()
        }

        ;(<any>ws).isAlive = false
        ws.ping(() => {})
      })
    }, 30 * 1000) //check every 30 seconds
  },
}
