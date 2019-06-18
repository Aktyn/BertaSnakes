import Connections, {Connection} from './connections';
import RoomInfo, {RoomSettings} from '../../common/room_info';
import GameStarter from './game_starter';
import Config from '../../common/config';

const MINIMUM_ROOMS = 3;

let rooms: Map<number, RoomInfo> = new Map();

function distributeRoomCreateEvent(room: RoomInfo) {//distribute room data for everyone in lobby
	Connections.forEachLobbyUser((conn) => conn.onRoomCreated(room));
}

function distributeRoomRemoveEvent(room: RoomInfo) {//distribute room remove event for everyone in lobby
	Connections.forEachLobbyUser((conn) => conn.onRoomRemove(room));
}

function disbtributeRoomUpdateEvent(room: RoomInfo) {
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
	createRoom(from_connection: Connection) {
		if(!from_connection.user)
			return;

		//creating room
		let name = `${from_connection.user.nick}'s room`;
		let room = addRoom(RoomInfo.nextRoomId(), name);

		this.joinRoom(from_connection, room.id);
	},

	updateRoomSettings(from_connection: Connection, settings: RoomSettings) {
		let room = from_connection.getRoom();
		if(!room || room.getOwner() !== from_connection.user)//only owner can update room settings
			return;
		room.updateSettings(settings);
		disbtributeRoomUpdateEvent(room);
	},

	sendRoomsList(from_connection: Connection) {
		if(from_connection.isInLobby())
			from_connection.sendRoomsList( Array.from(rooms.values()) );
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
			distributeRoomRemoveEvent(room);
			rooms.delete(room.id);
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
		if(!room || !from_connection.user)
			return;

		room.addUser(from_connection.user);
		from_connection.onRoomJoined();

		//send USER_JOINED_ROOM for every user in room expect the one that just joined
		room.forEachUser(user => {
			if(user.connection && room && from_connection.user)
				user.connection.onUserJoinedRoom(from_connection.user, room.id);
		});
	},

	kickUser(from_connection: Connection, user_id: number) {
		let room = from_connection.getRoom();
		let from_user = from_connection.user;
		
		if( !room || !from_user || from_user.id === user_id)//user cannot kick himself
			return;

		let room_owner = room.getOwner();
		if(room_owner && from_user.id === room_owner.id) {//user is room owner so he can kick
			let user_to_kick = room.getUserByID(user_id);
			if( !user_to_kick || !user_to_kick.connection )//no user to kick or is he not connected
				return;

			this.leaveRoom( user_to_kick.connection );

			user_to_kick.connection.sendKickInfo(room);
			//TODO: short ban for joining this room
		}
	},

	sitUser(from_connection: Connection) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;
		room.sitUser( from_connection.user );
		disbtributeRoomUpdateEvent(room);
	},

	stand(from_connection: Connection) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;
		room.standUpUser( from_connection.user );
		disbtributeRoomUpdateEvent(room);
	},

	readyUser(from_connection: Connection) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;
		if( room.everyoneReady() )
			return;
		room.setUserReady( from_connection.user );
		disbtributeRoomUpdateEvent(room);

		if( room.everyoneReady() ) {
			try {
				GameStarter.start_countdown(room, Config.START_GAME_COUNTDOWN);
			}
			catch(e) {//countdown failure - unreading everyone
				room.unreadyAll();
				disbtributeRoomUpdateEvent(room);
			}
		}
	},

	sendRoomMessage(from_connection: Connection, msg: string) {
		let room = from_connection.getRoom();
		if(!room || !from_connection.user)
			return;

		//TODO - store few previous user message timestamps to prevent spamming

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
	}
}