/* Client network handling */

const Network = (function() {
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	$$.assert(typeof window.WebSocket !== 'undefined', 'No websocket support');

	//const SERVER_IP = '192.168.0.2';
	const PORT = 2674;

	var CurrentUser = null;
	var CurrentRoom = null;
	var CurrentGameHandle = null;//handle to ClientGame instance

	var socket = null;

	var connection_attempts = 0;

	var restoreConnection = function() {//tries to connect to server again after some time
		if(++connection_attempts < 5)//max attempts
			setTimeout(connectToServer, 5000);
		else
			console.error('Server unreachable');
	};

	var connectToServer = function() {
		// socket = new WebSocket('ws://' + SERVER_IP + ':' + PORT);
		socket = new WebSocket('ws://' + window.location.hostname + ':' + PORT);

		socket.onopen = function() {
			connection_attempts = 0;
			//console.log('Connected to server');
		   	let curr = Stage.getCurrent();
			if(curr != null)
				curr.onServerConnected();
		};

		socket.onmessage = function(message) {
			if(message.isTrusted !== true)
				return;

			try {
				if(typeof message.data === 'string')//JSON object
					handleJSON( JSON.parse(message.data) );
				else if(typeof message.data === 'object') {//object - propably array buffer
					handleByteBuffer( message.data );
				}
				else 
					throw new Error('Incorrect message type');
			}
			catch(e) {
				console.log(e);
			}
		};

		socket.onclose = function(e) {
			//console.log('Server connection close', e.reason);
			restoreConnection();
			CurrentUser = null;
			CurrentRoom = null;
			socket = null;
			let curr = Stage.getCurrent();
			if(curr != null)
				curr.onServerDisconnect();
		};
		socket.onerror = function(error) {
			console.log('Socket error:', error);
		};
	};

	var handleJSON = function(json_data) {//handles json type message from server
		switch(json_data['type']) {
			//default: 
			//	throw new Error('Incorrect type value in JSON message');
			case NetworkCodes.PLAYER_ACCOUNT:
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
							CurrentUser.friend = JSON.parse( json_data['friends'] );
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
					CurrentRoom = RoomInfo.fromJSON( json_data['room_info'] );
					json_data['users'].forEach(user => CurrentRoom.addUser( UserInfo.fromJSON(user) ));
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
				break;
		}
		let curr = Stage.getCurrent();
		if(curr !== null)//passing message forward
			curr.onServerMessage(json_data);
	};

	var handleByteBuffer = (function() {
		//var reader = new FileReader(), second_reader = new FileReader();
		var readers = new Array(8).fill(0).map(() => {
			let reader = new FileReader();
			reader.onload = function() {
				try {
					if(CurrentGameHandle !== null)
						CurrentGameHandle.onServerData( new Float32Array(reader.result) );
				}
				catch(e) {
					console.error(e);
				}
			};

			return reader;
		});
		var reader_i;

		return function(data) {
			for(reader_i=0; reader_i<readers.length; reader_i++) {
				if(readers[reader_i].readyState !== 1) {//found not busy receiver
					readers[reader_i].readAsArrayBuffer( data );
					return;
				}
			}

			//none of readers are free
			console.log('all package receivers are overloaded');
			setTimeout(handleByteBuffer, 1, data);//
		};
	})();

	var sendJSON = function(data) {
		try {
			//if(typeof data === 'string')
			//	data = JSON.parse(data);
			//socket.send( JSON.stringify(data) );
			if(typeof data !== 'string')
				data = JSON.stringify(data);
			socket.send( data );
		}
		catch(e) {
			console.error('Cannot send message (' + data + '), reason:', e);
		}
	};

	connectToServer();//automatically after page load

	return {
		getCurrentUser: function() {
			return CurrentUser;
		},
		getCurrentRoom: function() {
			return CurrentRoom;
		},
		amISitting: function() {
			if(CurrentRoom === null || CurrentUser === null)
				return false;
			return CurrentRoom.isUserSitting(CurrentUser);
		},
		subscribeLobby: function() {
			sendJSON( {'type': NetworkCodes.SUBSCRIBE_LOBBY_REQUEST} );
		},
		joinRoom: function(id) {//@id - target room name
			sendJSON( {'type': NetworkCodes.JOIN_ROOM_REQUEST, 'id': id} );
		},
		leaveRoom: function() {//leaves current room
			$$.assert(CurrentRoom !== null, 'CurrentRoom is null');
			sendJSON( {'type': NetworkCodes.LEAVE_ROOM_REQUEST, 'id': CurrentRoom.id} );
		},
		createRoom: function() {
			sendJSON( {'type': NetworkCodes.CREATE_ROOM_REQUEST} );
		},
		sendRoomMessage: function(msg, room_name) {
			sendJSON( {'type': NetworkCodes.SEND_ROOM_MESSAGE, 'msg': msg} );
		},
		sendPrivateMessage: function(msg, target_user_id) {
			sendJSON( {'type': NetworkCodes.SEND_PRIVATE_MESSAGE, 
				'msg': msg, 'user_id': target_user_id} );
		},
		sendAddFriendRequest: function(user_id) {
			sendJSON( {'type': NetworkCodes.ADD_FRIEND_REQUEST, 'user_id': user_id} );
		},
		sendRemoveFriendRequest: function(user_id) {
			sendJSON( {'type': NetworkCodes.REMOVE_FRIEND_REQUEST, 'user_id': user_id} );
		},
		sendSitRequest: function() {
			sendJSON( {'type': NetworkCodes.SIT_REQUEST} );
		},
		sendStandUpRequest: function() {
			sendJSON( {'type': NetworkCodes.STAND_REQUEST} );
		},
		sendReadyRequest: function() {
			sendJSON( {'type': NetworkCodes.READY_REQUEST} );
		},
		requestAccountData: function() {
			sendJSON( {'type': NetworkCodes.ACCOUNT_DATA_REQUEST} );
		},
		requestShipUse: function(type) {
			sendJSON( {'type': NetworkCodes.SHIP_USE_REQUEST, 'ship_type': type} );
		},
		requestShipBuy: function(type) {
			sendJSON( {'type': NetworkCodes.SHIP_BUY_REQUEST, 'ship_type': type} );
		},
		requestSkillBuy: function(skill_id) {
			sendJSON( {'type': NetworkCodes.SKILL_BUY_REQUEST, 'skill_id': skill_id} );
		},
		requestSkillUse: function(skill_id) {
			sendJSON( {'type': NetworkCodes.SKILL_USE_REQUEST, 'skill_id': skill_id} );
		},
		requestSkillPutOff: function(skill_id) {
			sendJSON( {'type': NetworkCodes.SKILL_PUT_OFF_REQUEST, 'skill_id': skill_id} );
		},
		requestSkillsOrder: function(skills) {//@skills - array of skill indexes and nulls
			sendJSON( {'type': NetworkCodes.SKILLS_ORDER_REQUEST, 'skills': skills} );
		},
		requestUserKick: function(user_id) {
			sendJSON( {'type': NetworkCodes.USER_KICK_REQUEST, 'user_id': user_id} );
		},
		sendRoomUpdateRequest: function(name, sits_number, duration, map, gamemode) {
			sendJSON({
				'type': NetworkCodes.ROOM_UPDATE_REQUEST, 
				'name': name,
				'map': map,
				'gamemode': gamemode,
				'sits_number': sits_number,
				'duration': duration
			});
		},
		confirmGameStart: function() {
			sendJSON( {'type': NetworkCodes.START_GAME_CONFIRM} );
		},

		assignCurrentGameHandle: function(game) {
			CurrentGameHandle = game;
		},
		removeCurrentGameHandle: function() {
			CurrentGameHandle = null;
		},

		sendByteBuffer: function(buffer) {
			try {
				socket.send( buffer );
			}
			catch(e) {
				console.error('Cannot send byte buffer:', e);
			}
		}
	};
})();