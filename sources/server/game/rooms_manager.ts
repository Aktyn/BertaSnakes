import Connections, {Connection} from './connections';
import RoomInfo from '../../common/room_info';

const MINIMUM_ROOMS = 3;

let rooms: Map<number, RoomInfo> = new Map();

function distributeRoomCreateEvent(room: RoomInfo) {
	//distribute room data for everyone in lobby
	Connections.forEachLobbyUser((conn) => {
		conn.updateRoomListData(room);
	});
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
}, 1000 * 10);



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

	leaveRoom(from_connection: Connection, room_id: number) {
		//TODO

		//DELETE ROOM WHEN IT GETS EMPTY
	},

	joinRoom(from_connection: Connection, room_id: number) {
		let current_room = from_connection.getRoom();
		if( current_room )
			this.leaveRoom(from_connection, current_room.id);

		let room = rooms.get(room_id);
		if(!room || !from_connection.user)
			return;

		room.addUser(from_connection.user);
		from_connection.updateCurrentRoomData();
	}
}