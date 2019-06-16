import Connections, {Connection} from './connections';
import RoomInfo from '../../common/room_info';

const MINIMUM_ROOMS = 3;

let rooms: Map<number, RoomInfo> = new Map();

function distributeRoomCreateEvent(room: RoomInfo) {//distribute room data for everyone in lobby
	Connections.forEachLobbyUser((conn) => conn.onRoomCreated(room));
}

function distributeRoomRemoveEvent(room: RoomInfo) {//distribute room remove event for everyone in lobby
	Connections.forEachLobbyUser((conn) => conn.onRoomRemove(room));
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

			//ON_USER_LEFT_ROOM,//user_id: number, room_id: number
			//ON_USER_JOINED_ROOM,//user: UserCustomData, room_id: number
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
	}
}