/* Client network handling */
import ERROR_CODES from '../../../common/error_codes';
import NetworkCodes, {NetworkPackage} from '../../../common/network_codes';
import UserInfo from '../../../common/user_info';
import RoomInfo, {RoomSettings} from '../../../common/room_info';
import Config from '../../../common/config';

import Account from '../../account';

interface ListenersSchema {
	onServerConnected: () => void, 
	onServerDisconnect: () => void,
	onServerMessage: (data: NetworkPackage) => void,
}

interface GameListenersSchema {
	onServerData: (data: Float32Array) => void
}

let listeners: ListenersSchema | null = null;
let game_listeners: GameListenersSchema | null = null;
let socket: WebSocket | null = null;
let CurrentUser: UserInfo | null = null;
let CurrentRoom: RoomInfo | null = null;
let restore_timeout: number | null = null;

let connection_attempts = 0;

//@ts-ignore
const server_address = window.SOCKET_PROXY ||
	`${location.protocol === 'http:' ? 'ws' : 'wss'}://${location.hostname}:${Config.WEBSOCKET_PORT}`;

const HANDLERS = {
	handleJSON: function(json_data: NetworkPackage) {//handles json type message from server
		switch(json_data['type']) {
			//default: 
			//	throw new Error('Incorrect type value in JSON message');
			case NetworkCodes.ON_USER_DATA:
				if( !json_data['user'] )//user log out
					CurrentUser = null;
				CurrentUser = UserInfo.fromFullJSON(json_data['user']);
				Account.updateCustomData( CurrentUser.custom_data );
				break;
			case NetworkCodes.ON_ROOM_JOINED:
				try {
					CurrentRoom = RoomInfo.fromJSON(json_data['room']);
					for(let user_public_data of json_data['users'])
						CurrentRoom.addUser( UserInfo.fromJSON(user_public_data) );
				}
				catch(e) {
					console.error(e);
				}
				break;
			case NetworkCodes.ON_ROOM_LEFT:
				if(CurrentRoom && json_data['room_id'] === CurrentRoom.id)
					CurrentRoom = null;
				else
					console.warn('No room to left from');
				break;
			case NetworkCodes.ON_USER_LEFT_ROOM:
				if(CurrentRoom && CurrentRoom.id === json_data['room_id'] && 
					typeof json_data['user_id'] === 'number')
				{
					CurrentRoom.removeUserById( json_data['user_id'] );
				}
				break;
			case NetworkCodes.ON_USER_JOINED_ROOM:
				if(!CurrentRoom)
					break;
				CurrentRoom.addUser( UserInfo.fromJSON(json_data['user']) );
				break;
			case NetworkCodes.ON_ROOM_DATA_UPDATE: {
				if(!CurrentRoom)
					break;
				let updated_room = RoomInfo.fromJSON(json_data['room']);
				if(CurrentRoom.id === updated_room.id)
					CurrentRoom.updateData( updated_room );
					// CurrentRoom.updateSettings( updated_room.getSettings() )
			}	break;
			case NetworkCodes.ON_GAME_FAILED_TO_START://room: RoomCustomData, reason: ReasonCodes, error_data?: any
				if(CurrentRoom == null)
					throw new Error('CurrentRoom is empty');
				CurrentRoom.updateData( json_data['room'] );
				break;
			case NetworkCodes.END_GAME:
				if(CurrentRoom)
					CurrentRoom.unreadyAll();
				break;
		}
		
		if(listeners)
			listeners.onServerMessage(json_data);
	},

	handleByteBuffer: (function() {
		let readers = new Array(8).fill(0).map(() => {
			let reader = new FileReader();
			reader.onload = function() {
				try {
					if(game_listeners)
						game_listeners.onServerData( new Float32Array(<ArrayBuffer>reader.result) )
				}
				catch(e) {
					console.error(e);
				}
			};

			return reader;
		});
		let reader_i;

		return function(data: any) {
			for(reader_i=0; reader_i<readers.length; reader_i++) {
				if(readers[reader_i].readyState !== 1) {//found not busy receiver
					readers[reader_i].readAsArrayBuffer( data );
					return;
				}
			}

			//none of readers are free
			if(process.env.NODE_ENV === 'development')
				console.warn('all package receivers are overloaded');
			setTimeout(HANDLERS.handleByteBuffer, 1, data);
		};
	})()
};

function restoreConnection() {//tries to connect to server again after some time
	if(++connection_attempts < 5)//max attempts
		restore_timeout = setTimeout(Network.connect, 5000) as never;//clears in disconnect()
	else
		console.error('Server unreachable');
}

function sendJSON(data: NetworkPackage | string) {
	try {
		//if(typeof data === 'string')
		//	data = JSON.parse(data);
		//socket.send( JSON.stringify(data) );
		if(typeof data !== 'string')
			data = JSON.stringify(data);
		if(socket === null)
			throw new Error('socket is null');
		socket.send( data );
		return ERROR_CODES.SUCCESS;
	}
	catch(e) {
		console.error('Cannot send message, reason:', e);
		return ERROR_CODES.CANNOT_SEND_JSON_MESSAGE;
	}
}

const Network = {
	assignListeners(_listeners: ListenersSchema) {
		listeners = _listeners;
	},

	clearListeners() {
		listeners = null;
	},

	assignGameListeners(_listeners: GameListenersSchema) {
		game_listeners = _listeners;
	},

	clearGameListeners() {
		game_listeners = null;
	},

	connect() {
		if(socket !== null) {
			console.log('Websocket connection already established');
			return;
		}
		
		console.log('Connecting to websocket server:', server_address);
		socket = new WebSocket(server_address);

		socket.onopen = async function() {
			connection_attempts = 0;

			await Account.loginFromToken();
		   	if(listeners)
		   		listeners.onServerConnected();
		};

		socket.onmessage = function(message) {
			if(message.isTrusted !== true)
				return;

			try {
				if(typeof message.data === 'string')//JSON object
					HANDLERS.handleJSON( JSON.parse(message.data) );
				else if(typeof message.data === 'object')//object - probably Float32Array buffer
					HANDLERS.handleByteBuffer( message.data );
				else 
					throw new Error('Incorrect message type');
			}
			catch(e) {
				console.log(e, message && message.data);
			}
		};

		socket.onclose = function() {
			//console.log('Server connection close', e.reason);
			
			CurrentUser = null;
			CurrentRoom = null;
			socket = null;
			if(listeners)
		   		listeners.onServerDisconnect();
		};
		socket.onerror = function(error) {
			restoreConnection();
			console.log('Socket error:', error);
		};
	},

	reconnect() {
		if(socket === null)
			Network.connect();
	},

	disconnect() {
		if(restore_timeout) {
			clearTimeout(restore_timeout);
			restore_timeout = null;
		}
		if(socket)
			socket.close();
		socket = null;
	},

	getCurrentUser() {
		return CurrentUser;
	},
	getCurrentRoom() {
		return CurrentRoom;
	},

	login() {
		return sendJSON({'type': NetworkCodes.LOGIN, 'token': Account.getToken()});
	},
	requestAccountData() {
		return sendJSON({'type': NetworkCodes.ACCOUNT_DATA_REQUEST, 'token': Account.getToken()});
	},
	createRoom() {
		return sendJSON({'type': NetworkCodes.CREATE_ROOM_REQUEST});
	},
	requestRoomsList() {
		return sendJSON({'type': NetworkCodes.ROOM_LIST_REQUEST});
	},
	joinRoom(id: number) {//@id - target room name
		if(CurrentRoom && CurrentRoom.id === id)
			return ERROR_CODES.CANNOT_JOIN_CURRENT_ROOM;
		return sendJSON({'type': NetworkCodes.JOIN_ROOM_REQUEST, 'id': id});
	},
	leaveRoom() {//leaves current room
		if(CurrentRoom === null)
			return ERROR_CODES.USER_IS_NOT_IN_ROOM;
		return sendJSON({'type': NetworkCodes.LEAVE_ROOM_REQUEST});
	},
	sendRoomUpdateRequest(settings: RoomSettings) 
	{
		return sendJSON({
			'type': NetworkCodes.ROOM_SETTINGS_UPDATE_REQUEST, 
			'name': settings.name,
			'map': settings.map,
			'gamemode': settings.gamemode,
			'sits_number': settings.sits_number,
			'duration': settings.duration,
			'max_enemies': settings.max_enemies
		});
	},
	kickUser(user_id: number) {
		return sendJSON({'type': NetworkCodes.USER_KICK_REQUEST, 'user_id': user_id});
	},
	sendSitRequest() {
		return sendJSON({'type': NetworkCodes.SIT_REQUEST});
	},
	sendStandUpRequest() {
		return sendJSON({'type': NetworkCodes.STAND_REQUEST});
	},
	sendReadyRequest() {
		return sendJSON({'type': NetworkCodes.READY_REQUEST});
	},
	sendRoomChatMessage(msg: string) {
		return sendJSON({'type': NetworkCodes.SEND_ROOM_CHAT_MESSAGE, 'msg': msg});
	},
	confirmGameStart() {
		return sendJSON({'type': NetworkCodes.START_GAME_CONFIRMATION});
	},

	sendByteBuffer(buffer: Uint8Array) {
		try {
			if(socket !== null)
				socket.send( buffer );
		}
		catch(e) {
			console.error('Cannot send byte buffer:', e);
		}
	}
};

export default Network;