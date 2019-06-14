/* Client network handling */
import ERROR_CODES from '../../../common/error_codes';
import NetworkCodes, {NetworkPackage} from '../../../common/network_codes';
import UserInfo from '../../../common/user_info';
import RoomInfo from '../../../common/room_info';
import Config from '../../../common/config';

//@ts-ignore
// window.WebSocket = window.WebSocket || window.MozWebSocket;
// if(typeof WebSocket === 'undefined') throw new Error('No websocket support');

interface ListenersSchema {
	onServerConnected: () => void, 
	onServerDisconnect: () => void,
	onServerMessage: (data: NetworkPackage) => void,
	onServerData: (data: Float32Array) => void
}

var listeners: ListenersSchema | null = null;
var socket: WebSocket | null = null;
var CurrentUser: UserInfo | null = null;
var CurrentRoom: RoomInfo | null = null;
var restore_timeout: number | null = null;

var connection_attempts = 0;

const HANDLERS = {
	handleJSON: function(json_data: NetworkPackage) {//handles json type message from server
		switch(json_data['type']) {
			//default: 
			//	throw new Error('Incorrect type value in JSON message');
			case NetworkCodes.ON_USER_DATA:
				CurrentUser = UserInfo.fromFullJSON(json_data['user']);
				break;
			/*case NetworkCodes.PLAYER_ACCOUNT:
				//console.log(json_data, json_data['user_info']);
				try {
					CurrentUser = UserInfo.fromFullJSON(json_data['user_info']);
				}
				catch(e) {
					console.error('Cannot create user from JSON', e);
				}
				break;
			case NetworkCodes.ACCOUNT_DATA:
				try {
					if(CurrentUser !== null) {
						CurrentUser.custom_data = json_data['data'];
						if(typeof json_data['friends'] === 'string')
							CurrentUser.friends = JSON.parse( json_data['friends'] );
						else if(json_data['friends'] !== undefined)
							CurrentUser.friends = json_data['friends'];
					}
				}
				catch(e) {
					console.error(e);
				}
				break;
			case NetworkCodes.JOIN_ROOM_CONFIRM:
			case NetworkCodes.CHANGE_ROOM_CONFIRM:
				try {
					if(CurrentUser === null)
						throw new Error('CurrentUser is null');

					CurrentRoom = RoomInfo.fromJSON( json_data['room_info'] );
					json_data['users'].forEach((user: any) => 
						(<RoomInfo>CurrentRoom).addUser( UserInfo.fromJSON(user) ));

					CurrentUser.room = CurrentRoom;
				}
				catch(e) {
					console.error('Cannot create user from JSON', e);
				}
				break;
			case NetworkCodes.ON_ROOM_UPDATE:
				if(CurrentRoom != null) {
					let updated_room = RoomInfo.fromJSON( json_data['room_info'] );
					
					if(updated_room.id === CurrentRoom.id)
						CurrentRoom.updateData(updated_room);
				}
				break;
			case NetworkCodes.LEAVE_ROOM_CONFIRM:
				CurrentRoom = null;
				if(CurrentUser)
					CurrentUser.room = null;
				break;
			case NetworkCodes.USER_JOINED_ROOM:
				if(CurrentRoom == null)
					throw new Error('CurrentRoom is empty');
				CurrentRoom.addUser( UserInfo.fromJSON(json_data['user_info']) );
				break;
			case NetworkCodes.USER_LEFT_ROOM:
				if(CurrentRoom == null)
					throw new Error('CurrentRoom is empty');
				CurrentRoom.removeUser( json_data['user_id'] );
				CurrentRoom.updateData( json_data['room_info'] );
				break;
			case NetworkCodes.ON_KICKED:
				CurrentRoom = null;
				if(CurrentUser)
					CurrentUser.room = null;
				break;
			case NetworkCodes.START_GAME_FAIL:
				if(CurrentRoom == null)
					throw new Error('CurrentRoom is empty');
				CurrentRoom.updateData( json_data['room_info'] );
				break;*/
		}
		//let curr = Stages.getCurrent();
		//if(curr !== null)//passing message forward
		//	curr.onServerMessage(json_data);
		if(listeners)
			listeners.onServerMessage(json_data);
	},

	handleByteBuffer: (function() {
		//var reader = new FileReader(), second_reader = new FileReader();
		var readers = new Array(8).fill(0).map(() => {
			let reader = new FileReader();
			reader.onload = function() {
				try {
					if(listeners)
						listeners.onServerData( new Float32Array(<ArrayBuffer>reader.result) )
				}
				catch(e) {
					console.error(e);
				}
			};

			return reader;
		});
		var reader_i;

		return function(data: any) {
			for(reader_i=0; reader_i<readers.length; reader_i++) {
				if(readers[reader_i].readyState !== 1) {//found not busy receiver
					readers[reader_i].readAsArrayBuffer( data );
					return;
				}
			}

			//none of readers are free
			console.warn('all package receivers are overloaded');
			setTimeout(HANDLERS.handleByteBuffer, 1, data);
		};
	})()
}

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
		return true;
	}
	catch(e) {
		console.error('Cannot send message (' + data + '), reason:', e);
		return false;
	}
}

const Network = {
	assignListeners(_listeners: ListenersSchema) {
		listeners = _listeners;
	},

	clearListeners() {
		listeners = null;
	},

	connect() {
		if(socket !== null) {
			console.log('Websocket connection already established');
			return;
		}
		const server_address = 'ws://' + window.location.hostname + ':' + Config.WEBSOCKET_PORT;
		console.log('Connecting to websocket server:', server_address);
		socket = new WebSocket(server_address);

		socket.onopen = function() {
			connection_attempts = 0;

		   	if(listeners)
		   		listeners.onServerConnected();
		};

		socket.onmessage = function(message) {
			if(message.isTrusted !== true)
				return;

			try {
				if(typeof message.data === 'string')//JSON object
					HANDLERS.handleJSON( JSON.parse(message.data) );
				else if(typeof message.data === 'object')//object - probably array buffer
					HANDLERS.handleByteBuffer( message.data );
				else 
					throw new Error('Incorrect message type');
			}
			catch(e) {
				console.log(e);
			}
		};

		socket.onclose = function(e) {
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

	login( session_token: string | null ) {
		if( !sendJSON({'type': NetworkCodes.LOGIN, 'token': session_token}) )
			return ERROR_CODES.CANNOT_SEND_JSON_MESSAGE;
		return ERROR_CODES.SUCCESS;
	},
	requestAccountData() {
		sendJSON( {'type': NetworkCodes.ACCOUNT_DATA_REQUEST} );
	},

	////////////////////////////////////////
	//BELOW FUNCTIONS ARE BEFORE PROJECT RENEVAL

	amISitting() {
		if(CurrentRoom === null || CurrentUser === null)
			return false;
		return CurrentRoom.isUserSitting(CurrentUser.id);
	},
	subscribeLobby() {
		sendJSON( {'type': NetworkCodes.SUBSCRIBE_LOBBY_REQUEST} );
	},
	joinRoom(id: number) {//@id - target room name
		sendJSON( {'type': NetworkCodes.JOIN_ROOM_REQUEST, 'id': id} );
	},
	leaveRoom() {//leaves current room
		if(CurrentRoom === null)
			throw new Error('CurrentRoom is null');
		sendJSON( {'type': NetworkCodes.LEAVE_ROOM_REQUEST, 'id': CurrentRoom.id} );
	},
	createRoom() {
		sendJSON( {'type': NetworkCodes.CREATE_ROOM_REQUEST} );
	},
	sendRoomMessage(msg: string) {
		sendJSON( {'type': NetworkCodes.SEND_ROOM_MESSAGE, 'msg': msg} );
	},
	sendPrivateMessage(msg: string, target_user_id: number) {
		sendJSON( {'type': NetworkCodes.SEND_PRIVATE_MESSAGE, 
			'msg': msg, 'user_id': target_user_id} );
	},
	sendAddFriendRequest(user_id: number) {
		sendJSON( {'type': NetworkCodes.ADD_FRIEND_REQUEST, 'user_id': user_id} );
	},
	sendRemoveFriendRequest(user_id: number) {
		sendJSON( {'type': NetworkCodes.REMOVE_FRIEND_REQUEST, 'user_id': user_id} );
	},
	sendSitRequest() {
		sendJSON( {'type': NetworkCodes.SIT_REQUEST} );
	},
	sendStandUpRequest() {
		sendJSON( {'type': NetworkCodes.STAND_REQUEST} );
	},
	sendReadyRequest() {
		sendJSON( {'type': NetworkCodes.READY_REQUEST} );
	},
	requestShipUse(type: number) {//TODO - check this types
		sendJSON( {'type': NetworkCodes.SHIP_USE_REQUEST, 'ship_type': type} );
	},
	requestShipBuy(type: number) {
		sendJSON( {'type': NetworkCodes.SHIP_BUY_REQUEST, 'ship_type': type} );
	},
	requestSkillBuy(skill_id: number) {
		sendJSON( {'type': NetworkCodes.SKILL_BUY_REQUEST, 'skill_id': skill_id} );
	},
	requestSkillUse(skill_id: number) {
		sendJSON( {'type': NetworkCodes.SKILL_USE_REQUEST, 'skill_id': skill_id} );
	},
	requestSkillPutOff(skill_id: number) {
		sendJSON( {'type': NetworkCodes.SKILL_PUT_OFF_REQUEST, 'skill_id': skill_id} );
	},
	//@skills - array of skill indexes and nulls
	requestSkillsOrder(skills: (number | null)[]) {
		sendJSON( {'type': NetworkCodes.SKILLS_ORDER_REQUEST, 'skills': skills} );
	},
	requestUserKick(user_id: number) {
		sendJSON( {'type': NetworkCodes.USER_KICK_REQUEST, 'user_id': user_id} );
	},
	sendRoomUpdateRequest(name: string, sits_number: number, duration: number, 
		map: string, gamemode: number) 
	{
		sendJSON({
			'type': NetworkCodes.ROOM_UPDATE_REQUEST, 
			'name': name,
			'map': map,
			'gamemode': gamemode,
			'sits_number': sits_number,
			'duration': duration
		});
	},
	confirmGameStart() {
		sendJSON( {'type': NetworkCodes.START_GAME_CONFIRM} );
	},

	/*assignCurrentGameHandle: function(game: ClientGame.Game) {
		CurrentGameHandle = game;
	},
	removeCurrentGameHandle: function() {
		CurrentGameHandle = null;
	},*/

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