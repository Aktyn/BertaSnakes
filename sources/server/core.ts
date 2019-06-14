import Connections from './connections';
import {Server} from 'ws';
let open_port = 0;//can be initialized to zero since it is falsy value

export default {
	runAt( port: number ) {//port for websocket server
		if(open_port)
			throw new Error('Websocket is already open at port: ' + open_port);
		open_port = port;

		console.log('Running WebSocketServer at port:', port);

		const websock = new Server({ port });

		websock.on('connection', function(ws, req) {
			(<any>ws).isAlive = true;
			ws.on('pong', () => {
				(<any>ws).isAlive = true;//heartbeat
			});

			//new client's connection
			let connection = Connections.add(ws, req);

			ws.on('message', function(message) {
				connection.onMessage(message);
			});

			ws.on('close', () => {// close user connection
				console.log('connection close:', connection.id);
				Connections.remove(connection);
			});
		});

		//detecting dead connections
		setInterval(function ping() {
			websock.clients.forEach((ws) => {
				if((<any>ws).isAlive === false) {//connection doesn't send pong in time
					console.log('removing dead connection');
					return ws.terminate();
				}

				(<any>ws).isAlive = false;
				ws.ping(() => {});
			});
		}, 30 * 1000);//check every 30 seconds
	}
};