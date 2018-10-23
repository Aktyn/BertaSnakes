///<reference path="./../include/network_codes.ts"/>
///<reference path="./../include/room_info.ts"/>
///<reference path="./../include/user_info.ts"/>
///<reference path="./../include/game/maps.ts"/>
///<reference path="./../include/game/game_result.ts"/>
///<reference path="game_process.ts"/>
// const Core = (function() {
// 'use strict';
import Connection from './connection';

const START_GAME_COUNTDOWN = 1;//seconds
const MINIMUM_GAME_DURATION = 0*60;
const MAXIMUM_GAME_DURATION = 30*60;

const MAXIMUM_FRIENDS_NUMBER = 100;
const MAX_LEVEL = 99;

//const Connection = require('./connection.js');
function assert(condition: boolean, message: string) {
    if(!condition) {
        message = message || "Assertion failed";
        if(typeof Error !== "undefined")
            throw new Error(message);
        throw message;//fallback in case of poor browser support
    }
};

const NetworkCodes = require('./../include/network_codes');
const RoomInfo = require('./../include/room_info');
const UserInfo = require('./../include/user_info');
const Maps = require('./../include/game/maps');
//import GameProcess from './game_process';

import DatabaseUtils from './database_utils';

const Player = require('./../include/game/objects/player');
const Skills = require('./../include/game/common/skills');

import GameStarter from './game_starter';

import * as crypto from 'crypto';
import * as child_process from 'child_process';

var current_connections: Connection[] = [];
var avaible_rooms: RoomInfo[] = [];

//for(let i=0; i<5; i++)
//	avaible_rooms.push( new RoomInfo() );

setInterval(function() {//temporary - making sure that at least one room exists
	if(avaible_rooms.length < 1)
		createRoom();
		//avaible_rooms.push( new RoomInfo() );
}, 1000);

///////////////////////////////////////////////////////////////////

function updateAndSaveCustomData(user_id:number, custom_data:UserCustomData, result:PlayerResultJSON) 
{
	custom_data.exp += result.exp;
	if(custom_data.exp > 1) {//LEVEL UP
		custom_data.level += 1;
		if(custom_data.level > MAX_LEVEL)
			custom_data.level = MAX_LEVEL;
		custom_data.exp = (custom_data.exp-1.0) / 2.0;
	}
	custom_data.coins += result.coins;
	custom_data.rank += result.rank_reward;

	DatabaseUtils.updateUserCustomData( user_id, JSON.stringify(custom_data), custom_data.rank|0 );
}

function saveGameResult(room: RoomInfo, result_json: GameResultJSON) {
	//console.log( room );
	//console.log( msg.data.result.players_results );

	//updating user's database entries according to game result
	if(typeof result_json === 'string')
		result_json = JSON.parse(result_json);

	result_json.players_results.forEach(result => {
		if(result.user_id < 0)//ignore guests
			return;
		
		let online_user_conn = current_connections.find((conn: Connection) => {
			return conn.user !== null && conn.user.id === result.user_id;
		});

		//if ser is online there is no reason to fetch it's data from database
		if(online_user_conn !== undefined && online_user_conn.user !== null)
			updateAndSaveCustomData(online_user_conn.user.id, online_user_conn.user.custom_data,
				result);
		else {//update offline user according to game result
			DatabaseUtils.findUserByID(result.user_id).then(res => {
				if(res === null)
					throw new Error('Cannot find user in database, (id: ' + result.user_id + ')');
				
				//let custom_data = JSON.parse( res.custom_data );
				updateAndSaveCustomData(res.id, JSON.parse(res.custom_data), result);
			}).catch(e => console.error(e));
		}
	});

	//saving game result as database result
	var result_json_out = JSON.stringify(result_json);
	DatabaseUtils.saveGameResult(room.name, room.map, room.gamemode, room.duration, result_json_out);
}

function onGameFailedToStart(room: RoomInfo) {
	console.log('GAME FAILED TO START');

	//distributinng game start fail message to users in room
	room.unreadyAll();
	room.users.forEach(room_user => {
		if(room_user.connection === null)
			throw new Error('room_user has not assigned connection handler');
		room_user.connection.send(JSON.stringify({
			type: NetworkCodes.START_GAME_FAIL,
			room_info: room.toJSON()
		}));
	});

	//destroying game process
	if(room.game_process !== null) {
		room.game_process.kill('SIGINT');
		room.game_process = null;
	}
}

function startNewGame(room: RoomInfo) {
	console.log('Preparing to start new game. Waiting for players confirmations.');
	let confirmations = room.sits.slice();//copy of array with id's of playing users (copy of sits)

	room.onUserConfirm = (user_id: number) => {//@user_id - number
		//if(user_id instanceof UserInfo)
		//	user_id = user_id.id;
		//assert(typeof user_id === 'number', 'Incorrect argument type');

		console.log('\t' + user_id + ' confirmed');

		let index = confirmations.indexOf( user_id );
		if(index > -1)
			confirmations.splice(index, 1);

		if(confirmations.length === 0) {//everyone confirmed - starting game for good
			console.log('\tEveryone confirmed - Starting game');

			try {//starting serverside game
				room.game_process.send({
					action: 'run_game'
				});
			}
			catch(e) {
				console.error(e);
			}
		}
	};

	setTimeout(() => {//after 10 seconds check if everyone confirmed game start
		if(confirmations.length > 0)//if not
			onGameFailedToStart(room);
	}, 10 * 1000);

	// room.game_process.send(data);
	try {
		//distributting start game message to every user in room and waiting for confimations
		room.users.forEach(room_user => {
			if(room_user.connection == null)
				throw new Error('room_user has not assigned connection handler');
			room_user.lobby_subscriber = false;
			room_user.connection.send(JSON.stringify({
				type: NetworkCodes.START_GAME
			}));
		});

		//distributing to every lobby subscriber that room is no longer avaible
		current_connections.forEach(conn => {
			if(conn.user && conn.user.lobby_subscriber) {
				conn.send(JSON.stringify({
					type: NetworkCodes.ON_ROOM_REMOVED,
					room_id: room.id
				}));
			}
		});

		//starting server-side game in separate process
		//if(!GameProcess)
		//	throw new Error('GameProcess module not found');
		room.game_process = child_process.fork(__dirname + '/game_process');
		// var test = child_process.fork(__dirname + '/game_process');
		// test.on('message', )


		//game message
		(<child_process.ChildProcess>room.game_process).on('message', (msg: any) => {
			//console.log('[MainProcess]', msg);
			//console.log('[MainProcess]', 
			//	Object.keys(NetworkCodes).find((key,i)=>i===msg.action), msg);
			let user_i: number;

			switch(msg.action) {
				case NetworkCodes.START_ROUND_ACTION: {//@msg.data - game duration in seconds
					let pass_data = JSON.stringify( Object.assign({
						type: NetworkCodes.START_ROUND_COUNTDOWN
					}, msg.data) );

					//distribute start round message to every user in room
					room.users.forEach(room_user => {
						if(room_user.connection == null)
							throw new Error('room_user has not assigned connection handler');

						room_user.connection.send( pass_data );
					});
				}	break;
				case NetworkCodes.START_GAME_FAIL_ACTION:
					onGameFailedToStart(room);
					break;
				case NetworkCodes.END_GAME_ACTION: {
					let pass_data = JSON.stringify( Object.assign({
						type: NetworkCodes.END_GAME
					}, msg.data) );

					//distribute game end message to every user in room
					room.users.forEach(room_user => {
						if(room_user.connection == null)
							throw new Error('room_user has not assigned connection handler');
						room_user.connection.send( pass_data );
					});

					//killing game process
					if(room.game_process != null) {
						room.game_process.kill();
						room.game_process = null;
					}

					//saving game result to database
					saveGameResult(room, msg.data.result);
				}	break;
				case NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32://fast data distribution
					try {
						for(user_i=0; user_i<room.users.length; user_i++)
							room.users[user_i].connection.send( Float32Array.from(msg.data) );
					} catch(e) {
						console.error('Cannot send data to client:', e);
					}
					break;
			}
		});

		room.game_process.send({
			action: 'init_game',
			//sends array of only sitting users (actual players in game)
			users: room.users.filter(user => room.isUserSitting(user.id))
				.map(user => user.toFullJSON()),
			room_info: room.toJSON()
		});
		//console.log();
	}
	catch(e) {
		console.error(e);
	}
}

///////////////////////////////////////////////////////////////////

function getRoomByID(id: number) {
	for(let room of avaible_rooms) {
		if(room.id === id)
			return room;
	}
	return undefined;
}

function distributeRoomUpdate(room: RoomInfo) {
	//distributing to every lobby subscriber updated single room data
	current_connections.forEach(conn => {
		if(conn.user && conn.user.lobby_subscriber)
			conn.send(JSON.stringify({
				type: NetworkCodes.ON_ROOM_UPDATE,
				room_info: room.toJSON()
			}));
	});
}

function createRoom() {
	let room = new RoomInfo();
	avaible_rooms.push( room );

	//distribute new room info to lobby subscribers
	current_connections.forEach(conn => {
		if(conn.user && conn.user.lobby_subscriber)
			conn.send(JSON.stringify({
				type: NetworkCodes.ON_ROOM_CREATED,
				room_info: room.toJSON()
			}));
	});

	return room;
}

function removeRoom(room: RoomInfo) {
	let index = avaible_rooms.indexOf(room);
	if(index > -1)
		avaible_rooms.splice(index, 1);

	//distributing to every lobby subscriber that room is no longer exists
	current_connections.forEach(conn => {
		if(conn.user && conn.user.lobby_subscriber)
			conn.send(JSON.stringify({
				type: NetworkCodes.ON_ROOM_REMOVED,
				room_id: room.id
			}));
	});
}

function removeUserFromRoom(user: UserInfo, room: RoomInfo) {
	//assert(user instanceof UserInfo, 'User must be instance of UserInfo');
	//assert(room instanceof RoomInfo, 'User must be instance of RoomInfo');

	console.log('removing user', user.nick, 'from room:', room.name);

	if(room.removeUser(user) === false)
		throw new Error('user wasn\'t found in a given room |' + room.id + user.id);
	if(room.users.length === 0) {//room is empty - removing it
		console.log('Removing empty room, ', room.id);
		removeRoom(room);
	}
	else {//distribute user left room message
		try {
			room.users.forEach(room_user => {
				if(room_user.connection == null)
					throw new Error('room_user has not assigned connection handler');
				room_user.connection.send(JSON.stringify({
					type: NetworkCodes.USER_LEFT_ROOM,
					user_id: user.id,
					room_info: room.toJSON()
				}));
			});
			distributeRoomUpdate( room );
		}
		catch(e) {
			console.error(e);
		}
	}
}

function addUserToRoom(user: UserInfo, room: RoomInfo) {
	//assert(user instanceof UserInfo, 'User must be instance of UserInfo');
	//assert(room instanceof RoomInfo, 'User must be instance of RoomInfo');

	if(user.room != null && user.room != room)
		throw new Error('User is still in another room | ' + room.id + ' ' + user.id);
	room.addUser(user);
	
	//distribute user join message to every user in that room (except the joined user itself)
	try {
		room.users.forEach(room_user => {
			if(room_user === user)//ignore
				return;
			if(room_user.connection === null)
				throw new Error('room_user has not assigned connection handler');
			room_user.connection.send(JSON.stringify({
				type: NetworkCodes.USER_JOINED_ROOM,
				user_info: user.toJSON()
			}));
		});
	}
	catch(e) {
		console.error(e);
	}
}

function distributeAndUpdateAccountData(conn: Connection) {
	if(conn.user === null) throw 'connection.user cannot be null';
	//response with updated account data
	conn.send(JSON.stringify({
		type: NetworkCodes.ACCOUNT_DATA,
		data: conn.user.custom_data
	}));

	//updating user's custom_data in database
	DatabaseUtils.updateUserCustomData(
		conn.user.id, JSON.stringify(conn.user.custom_data), 
		conn.user.custom_data.rank|0 );
}

var handleJSON = function(connection: Connection, json_data: NetworkPackage) {
	if(connection.user === null)
		throw new Error('Connection\'s user doesn\'t exist');

	switch(json_data.type) {
		default: 
			throw new Error('Incorrect type value in JSON message');
		case NetworkCodes.SUBSCRIBE_LOBBY_REQUEST: {
			//console.log(connection.user);
			if(connection.user !== null/* && connection.user.room === null*/) {
				connection.user.lobby_subscriber = true;

				//send back current state of rooms list
				connection.send(JSON.stringify({
					type: NetworkCodes.SUBSCRIBE_LOBBY_CONFIRM,
					rooms: avaible_rooms.filter(room => room.game_process === null)
						.map(room => room.toJSON())
				}));
			}
		}	break;
		case NetworkCodes.ACCOUNT_DATA_REQUEST: {
			//updating friends online statuses
			let mapped = <FriendInfoI[]>JSON.parse(JSON.stringify(connection.user.friends));
			mapped.forEach((f) => {
				f.online = !!current_connections.find(conn => 
					conn.user !== null && conn.user.id === f.id);
			});

			connection.send(JSON.stringify({
				type: NetworkCodes.ACCOUNT_DATA,
				data: connection.user.custom_data,
				friends: mapped
			}));
		}	break;
		case NetworkCodes.SHIP_USE_REQUEST: {
			assert(typeof json_data.ship_type === 'number', 'ship_type must be a number');

			//checking whether user owns requested type of ship and it is not a guest
			if(connection.user.isGuest() === false &&
				connection.user.custom_data.avaible_ships.indexOf(json_data.ship_type) !== -1) {

				connection.user.custom_data.ship_type = json_data.ship_type;

				distributeAndUpdateAccountData(connection);
			}
		}	break;
		case NetworkCodes.SKILL_USE_REQUEST: {
			assert(typeof json_data.skill_id === 'number', 'skill_id must be a number');

			//checking whether user owns requested type of ship and it is not a guest
			if(connection.user.isGuest() === false &&
				connection.user.custom_data.avaible_skills.indexOf(json_data.skill_id) !== -1) {

				//iterating through skills_bar looking for empty place within array (a.k.a null)
				for(let i=0; i<connection.user.custom_data.skills.length; i++) {
					//skill already inside
					if( connection.user.custom_data.skills[i] === json_data.skill_id )
						break;

					if( connection.user.custom_data.skills[i] === null ) {//found empty place
						connection.user.custom_data.skills[i] = json_data.skill_id;
						break;
					}
				}

				distributeAndUpdateAccountData(connection);
			}
		}	break;
		case NetworkCodes.SKILL_PUT_OFF_REQUEST: {
			assert(typeof json_data.skill_id === 'number', 'skill_id must be a number');

			//checking whether user is not a guest
			if(connection.user.isGuest() === true)
				break;

			for(let i=0; i<connection.user.custom_data.skills.length; i++) {
				if(connection.user.custom_data.skills[i] === json_data.skill_id) {//take off
					connection.user.custom_data.skills[i] = null;
					distributeAndUpdateAccountData(connection);
					break;
				}
			}
		}	break;
		case NetworkCodes.SKILLS_ORDER_REQUEST: {//@skills - array of skill indexes and nulls
			
			assert(typeof json_data.skills === 'object', 'skills must be an array');

			//checking whether user is not a guest
			if(connection.user.isGuest() === true)
				break;

			let custom_data = connection.user.custom_data;

			assert(json_data.skills.length === custom_data.skills.length, 
				'Different sizes of arrays of skills indexes');

			for(let i=0; i<json_data.skills.length; i++) {
				//this skill is avaible for user or null
				if(custom_data.avaible_skills.indexOf(json_data.skills[i]) !== -1 || 
						json_data.skills[i] === null) {
					custom_data.skills[i] = json_data.skills[i];
				}
			}

			//checking for duplicates
			for(let i=0; i<custom_data.skills.length; i++) {
				for(let j=i+1; j<custom_data.skills.length; j++) {
					if(custom_data.skills[i] === custom_data.skills[j])
						custom_data.skills[j] = null;
				}
			}

			distributeAndUpdateAccountData(connection);
		}	break;
		case NetworkCodes.SHIP_BUY_REQUEST: {	
			assert(typeof json_data.ship_type === 'number', 'ship_type must be a number');

			if(connection.user.isGuest() === true)
				break;

			let cost = Player.SHIP_COSTS[json_data.ship_type];
			let lvl_requirement = Player.SHIP_LVL_REQUIREMENTS[json_data.ship_type];

			let error_detail = null;
			
			if(connection.user.custom_data.avaible_ships.indexOf(json_data.ship_type) !== -1)
				error_detail = 'ship_already_avaible';
			else if(connection.user.custom_data.coins < cost)
				error_detail = 'not_enough_coins';
			else if(connection.user.custom_data.level < lvl_requirement)
				error_detail = 'insufficient_level';

			if(error_detail === null) {//success
				//adding ship to user's collection
				connection.user.custom_data.avaible_ships.push( json_data.ship_type );
				//taking coins
				connection.user.custom_data.coins -= cost;

				//(optionally) automatically sets user's selected ship to already bought one
				connection.user.custom_data.ship_type = json_data.ship_type;

				distributeAndUpdateAccountData(connection);
			}
			else {
				connection.send(JSON.stringify({
					type: NetworkCodes.TRANSACTION_ERROR,
					error_detail: error_detail
				}));
			}
		}	break;
		case NetworkCodes.SKILL_BUY_REQUEST: {
			assert(typeof json_data.skill_id === 'number', 'skill_id must be a number');

			if(connection.user.isGuest() === true)
				break;

			// const skill = Object.values(Skills).find(s => 
			// 	typeof s === 'object' 		&& 
			// 	typeof s.name === 'string' 	&& 
			// 	s.id === json_data.skill_id);
			const skill_name = Object.keys(Skills).find(s_key => 
				typeof Skills[s_key] === 'object' 		&& 
				typeof Skills[s_key].name === 'string' 	&& 
				Skills[s_key].id === json_data.skill_id);

			if(skill_name === undefined)
				break;

			const skill = Skills[skill_name];

			let error_detail: string | null = null;
			
			if(connection.user.custom_data.avaible_skills.indexOf(json_data.skill_id) !== -1)
				error_detail = 'skill_already_avaible';
			else if(connection.user.custom_data.coins < skill.price)
				error_detail = 'not_enough_coins';
			else if(connection.user.custom_data.level < skill.lvl_required)
				error_detail = 'insufficient_level';

			if(error_detail === null) {//success
				//adding skill to user's collection
				connection.user.custom_data.avaible_skills.push( json_data.skill_id );
				//taking coins
				connection.user.custom_data.coins -= skill.price;

				distributeAndUpdateAccountData(connection);
			}
			else {
				connection.send(JSON.stringify({
					type: NetworkCodes.TRANSACTION_ERROR,
					error_detail: error_detail
				}));
			}
		}	break;
		case NetworkCodes.USER_KICK_REQUEST: {
			if(connection.user.room === null)
				throw new Error('User is not in room.');
			assert(typeof json_data.user_id === 'number', 'user_id must be a number');

			//if user is room's owner but room is not a game
			var _owner = connection.user.room.getOwner();
			if(_owner !== undefined && _owner.id === connection.user.id && 
				connection.user.room.game_process === null) 
			{
				let target_user = connection.user.room.getUserByID( json_data.user_id );

				//if target user is in same room but it is not same user
				if(target_user !== null && target_user.id !== connection.user.id) {
					//removing user from room
					target_user.connection.send(JSON.stringify({
						type: NetworkCodes.ON_KICKED
					}));
					removeUserFromRoom(target_user, connection.user.room);
				}
			}
		}	break;
		case NetworkCodes.JOIN_ROOM_REQUEST: {
			//if(connection.user == null)//user not logged in
			//	break;
			console.log('User', connection.user.nick, 'request room join [' + json_data.id + ']');

			let room = getRoomByID(json_data.id);
			if(!room)
				throw new Error('Room not found');

			if(room.game_process !== null)//cannot join room with game started
				break;

			//if user is in another room
			if(connection.user.room !== null) {
				if(connection.user.room.id === json_data.id)//same room - ignoring it
					break;
				let old_room_id = connection.user.room.id;
				//kicking user from that room
				removeUserFromRoom(connection.user, connection.user.room);

				//joining room by user
				addUserToRoom(connection.user, room);

				//accepting user request (not JOIN ROOM BUT CHANGE ROOM)
				connection.send(JSON.stringify({
					type: NetworkCodes.CHANGE_ROOM_CONFIRM,
					old_room_id: old_room_id,
					room_info: room.toJSON(),
					users: room.users.map(user => user.toJSON())
				}));
				console.log('\tuser joined');
			}
			else {
				//joining room by user
				addUserToRoom(connection.user, room);

				//accepting user request
				connection.send(JSON.stringify({
					type: NetworkCodes.JOIN_ROOM_CONFIRM,
					room_info: room.toJSON(),
					users: room.users.map(user => user.toJSON())
				}));
				console.log('\tuser joined');
			}
		}	break;
		case NetworkCodes.LEAVE_ROOM_REQUEST: {
			if(connection.user.room === null || connection.user.room.id !== json_data.id)
				throw new Error('Given room id mismatch with those serverside');
			removeUserFromRoom(connection.user, connection.user.room);

			connection.send(JSON.stringify({
				type: NetworkCodes.LEAVE_ROOM_CONFIRM
			}));
		}	break;
		case NetworkCodes.CREATE_ROOM_REQUEST: {
			let room = createRoom();

			connection.send(JSON.stringify({
				type: NetworkCodes.CREATE_ROOM_CONFIRM,
				room_info: room.toJSON()
			}));
		}	break;
		case NetworkCodes.STAND_REQUEST:
		case NetworkCodes.SIT_REQUEST: {
			if(connection.user.room === null)
				throw new Error('User is not in room.');

			let sit_req = json_data.type === NetworkCodes.SIT_REQUEST;

			if(connection.user.room.isUserSitting(connection.user.id) !== sit_req) {
				if(sit_req)	connection.user.room.sitUser( connection.user.id );
				else	connection.user.room.standUpUser( connection.user.id );
				
				distributeRoomUpdate( connection.user.room );
			}
		}	break;
		case NetworkCodes.READY_REQUEST: {
			if(connection.user.room === null)
				throw new Error('User is not in room.');

			//first safety for multiple game countdown
			if(connection.user.room.everyoneReady() === true)
				break;

			//false means user cannot get ready (not sitting or is already ready)
			if(connection.user.room.setUserReady(connection.user.id) === true)
				distributeRoomUpdate( connection.user.room );

			//checking if every player is ready to start the game
			if(connection.user.room.everyoneReady() === true) {
				try {
					GameStarter.start_countdown(connection.user.room, 
						START_GAME_COUNTDOWN, startNewGame);
				}
				catch(e) {//countdown failure - unreading everyone
					connection.user.room.unreadyAll();
					distributeRoomUpdate( connection.user.room );
				}
			}
		}	break;
		case NetworkCodes.START_GAME_CONFIRM: {
			if(connection.user.room === null)
				throw new Error('User is not in room.');

			let room = connection.user.room;

			if(typeof room.onUserConfirm === 'function')
				room.onUserConfirm( connection.user.id );
		}	break;
		case NetworkCodes.ROOM_UPDATE_REQUEST: {
			if(connection.user.room === null)
				throw new Error('User is not in room.');

			let room = connection.user.room;

			//checking if user is room owner (first user)
			var _owner = room.getOwner();
			if(_owner !== undefined && _owner.id === connection.user.id) {
				assert(typeof json_data.name === 'string', 'room name must be a string');
				assert(typeof json_data.map === 'string', 'map name must be a string');
				assert(typeof json_data.sits_number === 'number', 'sits number must be a number');
				assert(json_data.sits_number > 0, 'number of sits must be positive');
				assert(json_data.sits_number <= 8, 'number of sits cannot be larger then 8');
				assert(typeof json_data.duration === 'number', 'duration must be a number');
				assert(json_data.duration > MINIMUM_GAME_DURATION, 
					'duration must be longer or equal 3 minutes');
				assert(json_data.duration <= MAXIMUM_GAME_DURATION, 
					'duration must be no longer than 30 minutes');
				assert(typeof json_data.gamemode === 'number', 'gamemode must be a number');
				assert(json_data.gamemode >= 0 && json_data.gamemode < 2, 'incorrect gamemode');

				if(room.name === json_data.name && room.sits.length === json_data.sits_number &&
						room.map === json_data.map && room.duration === json_data.duration &&
						room.gamemode === json_data.gamemode)
					break;//new settings are the same - discarding the change request

				if(json_data.gamemode === RoomInfo.MODES.COMPETITION && 
						json_data.sits_number < 2)//must be at least 2 players in competition mode
					break;

				if(json_data.name.length > 32)
					json_data.name = json_data.name.substring(0, 32);
				room.name = json_data.name;
				room.changeSitsNumber( json_data.sits_number );
				room.gamemode = json_data.gamemode;
				room.duration = json_data.duration;

				let map = Maps.getByName(json_data.map);
				if(map != null)
					room.map = map.name;

				//sending room update
				distributeRoomUpdate( connection.user.room );
			}
		}	break;
		case NetworkCodes.SEND_ROOM_MESSAGE: {
			if(connection.user.room === null)
				throw new Error('User is not in room.');
			assert(typeof json_data.msg === 'string', 'Chat message is not type of string');

			if(json_data.msg.length > 256)//maximum length of message
				json_data.msg = json_data.substring(0, 256);

			const room_message = JSON.stringify({
				type: NetworkCodes.RECEIVE_CHAT_MESSAGE,
				from: connection.user.nick,
				public: true,
				id: connection.user.room.id,//room id
				msg: json_data.msg
			});
			//send chat message to every user on room
			connection.user.room.users.forEach(user => user.connection.send(room_message));
		}	break;
		case NetworkCodes.SEND_PRIVATE_MESSAGE: {
			assert(typeof json_data.msg === 'string', 'Chat message is not type of string');
			assert(typeof json_data.user_id === 'number', 'user_id is not type of number');
			
			if(json_data.msg.length > 256)//maximum length of message
				json_data.msg = json_data.substring(0, 256);

			//finding target user
			for(let i=0; i<current_connections.length; i++) {
				var _conn = current_connections[i].user;
				if(_conn !== null && _conn.id === json_data.user_id) {
					//let target_user = this.current_connections[i].user;
					//TODO - check if target user haven't disabled private messages receiving
					
					//send message back to sender so he can see what sended
					connection.send(JSON.stringify({
						type: NetworkCodes.RECEIVE_CHAT_MESSAGE,
						from: connection.user.nick,
						public: false,
						id: json_data.user_id,//receiver user id
						msg: json_data.msg
					}));

					//send to receiver
					current_connections[i].send(JSON.stringify({
						type: NetworkCodes.RECEIVE_CHAT_MESSAGE,
						from: connection.user.nick,
						public: false,
						id: connection.user.id,//sender user id
						msg: json_data.msg
					}));

					if(true) {//build dataset
						/* jshint multistr:true */
						DatabaseUtils.customQuery("INSERT INTO `BertaBall`.`chat_dataset` \
							(`timestamp`, `from`, `to`, `message`) \
							VALUES ('" + Date.now() + "', '" + connection.user.nick + "', '" + 
							_conn.nick + "', '" + json_data.msg + "')");
						/* jshint multistr:false */
					}

					break;
				}
			}
		}	break;
		case NetworkCodes.ADD_FRIEND_REQUEST: {
			assert(typeof json_data.user_id === 'number', 'user_id is not type of number');
			assert(json_data.user_id > 0, 'user cannot be guest');
			assert(connection.user.id > 0, 'guest cannot add friends');

			//if already a friend
			if( connection.user.friends.find(f => f.id === json_data.user_id) !== undefined )
				break;

			if( connection.user.friends.length >= MAXIMUM_FRIENDS_NUMBER )
				break;

			for(let i=0; i<current_connections.length; i++) {
				var _conn = current_connections[i].user;
				if(_conn !== null && _conn.id === json_data.user_id) {
					//found online target user

					connection.user.friends.push({
						id: _conn.id,
						nick: _conn.nick
					});

					//update user's database entry
					DatabaseUtils.updateFriendsList(
						connection.user.id, JSON.stringify(connection.user.friends));

					//send back confirmation
					connection.send(JSON.stringify({
						type: NetworkCodes.ADD_FRIEND_CONFIRM,
						id: _conn.id
					}));

					break;
				}
			}
		}	break;
		case NetworkCodes.REMOVE_FRIEND_REQUEST: {
			assert(typeof json_data.user_id === 'number', 'user_id is not type of number');

			for(let i=0; i<connection.user.friends.length; i++) {
				if(connection.user.friends[i].id === json_data.user_id) {
					connection.user.friends.splice(i, 1);

					//update user's database entry
					DatabaseUtils.updateFriendsList(
						connection.user.id, JSON.stringify(connection.user.friends));

					//send back confirmation
					connection.send(JSON.stringify({
						type: NetworkCodes.REMOVE_FRIEND_CONFIRM,
						id: json_data.user_id
					}));
				}
			}
		}	break;
	}
};

var loginAsGuest = function(connection: Connection) {
	var new_user = new UserInfo();//guest

	connection.send(JSON.stringify({
		type: NetworkCodes.PLAYER_ACCOUNT,
		user_info: new_user.toFullJSON(),
	}));

	connection.user = new_user;
};

export default {
	addConnection: function(connection: Connection) {
		current_connections.push(connection);
		
		//checking if connection is from logged in user
		let key = null;
		try {
			key = connection.req.headers.cookie.match(/.*user_session=([^;]*)/i)[1]
				.replace(/%3D/gi, '=');//escape '=' chars
			//console.log('user key:', key, 'user-agent', connection.req.headers['user-agent']);
		} catch(e) {//user not logged in
			loginAsGuest(connection);
			return;
		}

		const session_key = crypto.createHash('sha256')
			.update(connection.req.headers['user-agent'] + connection.ip + key).digest('base64');
	
		// console.log(session_key);
		DatabaseUtils.checkSession(session_key).then((res) => {
			if(res.length > 0) {//logged in as user
				let new_id = res[0].id|0;
				if(current_connections.some((conn) => conn.user !== null && conn.user.id === new_id)) {
					console.log('user already logged in - TODO - do something about it');
					connection.close();
					this.removeConnection(connection);
					return;
				}
				var new_user = new UserInfo(new_id, res[0].nickname, res[0].custom_data);
				try {
					//
					new_user.friends = JSON.parse( res[0].friends );
				}
				catch(e) {
					console.error('Incorrect "friends" field in database: ', e);
				}

				connection.send(JSON.stringify({//TODO - send private user data
					type: NetworkCodes.PLAYER_ACCOUNT,
					user_info: new_user.toFullJSON()
				}));

				connection.user = new_user;
			}
			else
				loginAsGuest(connection);
		}).catch(e => console.error('Session checking error', e));
	},
	removeConnection: function(connection: Connection) {
		let index = current_connections.indexOf(connection);
		if(index > -1) {
			/*if(current_connections[index].user && current_connections[index].user.room)
				removeUserFromRoom(
					current_connections[index].user, 
					current_connections[index].user.room);*/
			if(connection.user !== null && connection.user.room)
				removeUserFromRoom(
					connection.user, 
					connection.user.room);
			current_connections.splice(index, 1);
		}
		else
			console.error('Trying to remove connection that doesn\'t exists in array?');
	},

	onMessage: function(connection: Connection, message: any) {
		try {
			if(typeof message === 'string')//stringified JSON object
				handleJSON( connection, JSON.parse(message) );
			else if(typeof message === 'object') {//object - propably array buffer
				if(connection.user && connection.user.room && connection.user.room.game_process) {
					connection.user.room.game_process.send( 
						{user_id: connection.user.id, data: message} );
				}
			}
			else throw new Error('Incorrect message type');
		}
		catch(e) {
			console.log('Message handle error: ', e);
		}
	}
};
// })();

// module.exports = Core;