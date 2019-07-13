import {Server} from 'ws';
import {handleMessage} from './message_handler';
import SocialConnection from './social_connection';
import SOCIAL_CODES, {SocialNetworkPackage} from '../../common/social_codes';
import Database from '../database/core';
import ERROR_CODES from '../../common/error_codes';

let open_port = 0;//can be initialized to zero since it is falsy value

async function authenticateConnection(socket: any, token: string) {
	let res = await Database.getAccountFromToken(token);
	if( res.error !== ERROR_CODES.SUCCESS || !res.account ) {
		socket.close();
		return null;
	}
	
	return new SocialConnection(socket, res.account);
}

export default {
	runAt(port: number) {//port for websocket server
		if(open_port)
			throw new Error('WebSocketSocialServer is already open at port: ' + open_port);
		open_port = port;
		
		console.log('Running WebSocketSocialServer at port:', port);
		
		const websocket = new Server({ port });

		websocket.on('connection', function(ws/*, req*/) {
			(<any>ws).isAlive = true;
			ws.on('pong', () => {
				(<any>ws).isAlive = true;//heartbeat
			});

			//social connection handler
			let connection: SocialConnection | null = null;

			ws.on('message', async function(message) {
				if(typeof message !== 'string')
					return;
				let msg: SocialNetworkPackage = JSON.parse(message);
				if( !connection ) {
					if( msg.type === SOCIAL_CODES.REGISTER_CONNECTION )
						connection = await authenticateConnection(ws, msg.token);
					return;
				}
				
				handleMessage(connection, msg).catch(console.error);
			});

			ws.on('close', () => {// close user connection
				if(connection)
					connection.destroy();
			});
		});

		//detecting dead connections
		setInterval(function ping() {
			websocket.clients.forEach((ws) => {
				if((<any>ws).isAlive === false) {//connection doesn't send pong in time
					console.log('removing dead connection');
					return ws.terminate();
				}

				(<any>ws).isAlive = false;
				ws.ping(() => {});
			});
		}, 30 * 1000);//check every 30 seconds
	}
}