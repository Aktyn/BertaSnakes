import Connections, {Connection} from './connections';
import RoomInfo, {RoomSettings} from '../../common/room_info';
import GameStarter from './game_starter';
import Config from '../../common/config';
import UserInfo from "../../common/user_info";
import {NotificationCodes, ReasonCodes} from '../../common/network_codes';
import GameHandler from './game_handler';

const MINIMUM_ROOMS = 3;

let rooms: Map<number, RoomInfo> = new Map();

function distributeRoomCreateEvent(room: RoomInfo) {//distribute room data for everyone in lobby
	Connections.forEachLobbyUser((conn) => conn.onRoomCreated(room));
}

function distributeRoomRemoveEvent(room: RoomInfo) {//distribute room remove event for everyone in lobby
	Connections.forEachLobbyUser((conn) => conn.onRoomRemove(room));
}

function distributeRoomUpdateEvent(room: RoomInfo) {
	Connections.forEachLobbyUser((conn) => conn.onRoomUpdate(room));
}

function addRoom(id: number, name: string) {
	let room = new RoomInfo(id, name);
	rooms.set(room.id, room);
	distributeRoomCreateEvent(room);
	return room;
}

setInterval(() => {//making sure there are at least few rooms existing
	if(rooms.size < MINIMUM_ROOMS) {
		let id = RoomInfo.nextRoomId();
		let name = `Room #${id}`;

		addRoom(id, name);
	}
}, 1000 * 3);


//from_connection - connections that requested to create room
export default {
	getRooms() {
		return rooms;
	},
	
	createRoom(from_connection: Connection) {
		if(!from_connection.user)
			return;

		//creating room
		let name = `${from_connection.user.nick}'s room`;
		let room = addRoom(RoomInfo.nextRoomId(), name);

		this.joinRoom(from_connection, room.id);
	},

	deleteRoomAfterGame(room: RoomInfo) {
		//NOTE - remove room event is not distributed
		if( !rooms.delete(room.id) )
			console.error('Cannot delete room: ' + room.id);
	},
	
	restoreRoomAfterGame(room: RoomInfo) {//makes everyone in lobby see this room on rooms list
		distributeRoomCreateEvent(room);
	},

	updateRoomSettings(from_connection: Connection, settings: RoomSettings) {
		let room = from_connection.getRoom();
		if(!room || room.getOwner() !== from_connection.user)//only owner can update room settings
			return;
		room.updateSettings(settings);
		distributeRoomUpdateEvent(room);
	},

	sendRoomsList(from_connection: Connection) {
		if(from_connection.isInLobby()) {
			let available_rooms = Array.from(rooms.values()).filter(room => {
				//rooms that are not games and user in not banned from joining this room
				return !room.game_handler && from_connection.user && !room.banned_ips.has(from_connection.client_ip);
			});
			from_connection.sendRoomsList( available_rooms );
		}
	},

	leaveRoom(from_connection: Connection) {
		let room = from_connection.getRoom();
		let from_user = from_connection.user;
		if(!room || !from_user)
			return;

		room.removeUser(from_user);
		from_connection.onRoomLeft(room.id);

		//REMOVE ROOM WHEN IT GETS EMPTY
		if( room.isEmpty() ) {
			if( !room.game_handler ) {//AND NOT DURING GAME
				distributeRoomRemoveEvent(room);
				rooms.delete(room.id);
			}
			else {//IF IT IS DURING GAME THEN SPEED IT UP
				(<GameHandler>room.game_handler).onRoomEmptied(room);
			}
		}
		else {//send USER_LEFT_ROOM for every other user in room
			room.forEachUser(user => {
				if(user.connection && from_user && room)
					user.connection.onUserLeftRoom(from_user.id, room.id);
			});
		}
	},

	joinRoom(from_connection: Connection, room_id: number) {
		let current_room = from_connection.getRoom();
		if( current_room )
			this.leaveRoom(from_connection);

		let room = rooms.get(room_id);
		if(!from_connection.user)
			return;
		if(!room) {
			from_connection.sendNotification(NotificationCodes.ROOM_DOES_NOT_EXISTS);
			return;
		}
		if( room.game_handler ) {
			from_connection.sendNotification(NotificationCodes.CANNOT_JOIN_AFTER_GAME_START);
			return;
		}
		if( room.banned_ips.has(from_connection.client_ip) ) {
			from_connection.sendNotification(NotificationCodes.BANNED_FROM_ROOM);
			return;
		}
		
		room.addUser(from_connection.user);
		from_connection.onRoomJoined();

		//send USER_JOINED_ROOM for every user in room expect the one that just joined
		room.forEachUser(user => {
			if(user.connection && room && from_connection.user && from_connection.user.id !== user.connection.id)
				user.connection.onUserJoinedRoom(from_connection.user, room.id);
		});
	},
	
	onRoomUserCustomDataUpdate(room: RoomInfo, user: UserInfo) {
		//distribute user public data over other room users
		room.forEachUser((room_user) => {
			if(user && room_user.id !== user.id && room_user.connection)
				room_user.connection.onUserJoinedRoom(user, room.id);
		});
	},

	kickUser(from_connection: Connection, user_id: number) {
		let room = from_connection.getRoom();
		let from_user = from_connection.user;
		
		if( !room || !from_user || from_user.id === user_id)//user cannot kick himself
			return;
		
		if( room.game_handler && room.isUserSitting(user_id) )//cannot kick player during game
			return;

		let room_owner = room.getOwner();
		if(room_owner && from_user.id === room_owner.id) {//user is room owner so he can kick
			let user_to_kick = room.getUserByID(user_id);
			if( !user_to_kick || !user_to_kick.connection )//no user to kick or is he not connected
				return;

			this.leaveRoom( user_to_kick.connection );

			user_to_kick.connection.sendKickInfo(room);
			
			//ban for joining this room again
			room.banned_ips.add( user_to_kick.connection.client_ip );
			//room.banned_users.add( user_to_kick.id );
			user_to_kick.connection.onRoomRemove(room);
		}
	},

	sitUser(from_connection: Connection) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;
		room.sitUser( from_connection.user );
		distributeRoomUpdateEvent(room);
	},

	stand(from_connection: Connection) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;
		room.standUpUser( from_connection.user );
		distributeRoomUpdateEvent(room);
	},

	readyUser(from_connection: Connection) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;
		if( room.everyoneReady() || !room.everyoneSits() )
			return;
		room.setUserReady( from_connection.user );
		distributeRoomUpdateEvent(room);

		if( room.everyoneReady() ) {
			try {
				GameStarter.start_countdown(room, Config.START_GAME_COUNTDOWN);
			}
			catch(e) {//countdown failure - unready everyone
				room.unreadyAll();
				distributeRoomUpdateEvent(room);
			}
		}
	},

	sendRoomMessage(from_connection: Connection, msg: string) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;

		if( !from_connection.user.canSendChatMessage() ) {
			if( from_connection.user.connection )
				from_connection.user.connection.sendSpamWarning(room.id);
			return;
		}

		let message = {
			author_id: from_connection.user.id,
			timestamp: Date.now(),
			content: msg.substr(0, Config.MAXIMUM_MESSAGE_LENGTH)
		};
		room.forEachUser(user => {
			if(!user.connection)
				return;
			user.connection.sendRoomMessage((<RoomInfo>room).id, 
				message.author_id, message.timestamp, message.content);
		});
		
		from_connection.user.registerLastMessageTimestamp(message.timestamp);
	},
	
	onGameFailedToStart(room: RoomInfo, unconfirmed_users?: number[]) {
		console.warn('Game failed to start:', room.id);
	
		room.unreadyAll();
		room.forEachUser(user => {
			if(user.connection) {
				user.connection.sendGameStartFailEvent(
					room,
					unconfirmed_users ? ReasonCodes.USER_DOES_NOT_CONFIRM_GAME : ReasonCodes.SERVER_ERROR,
					unconfirmed_users
				);
			}
		});
	
		//make this rooms appear again at user's rooms list
		Connections.forEachLobbyUser(conn => conn.onRoomCreated(room));
	},
	
	onServerOverload(room: RoomInfo) {
		console.warn('Game failed to start because server is overloaded:', room.id);
		
		room.unreadyAll();
		room.forEachUser(user => {
			if(user.connection)
				user.connection.sendGameStartFailEvent(room, ReasonCodes.SERVER_OVERLOAD);
		});
	}
}