import UserInfo, {UserCustomData} from '../../common/user_info';
import RoomInfo from '../../common/room_info';

import NetworkCodes from '../../common/network_codes';

let connections: Map<number, Connection> = new Map();

export class Connection {
	private static counter = 0;
	readonly id: number;
	private socket: any;
	private req: any;
	public user: UserInfo | null = null;

	constructor(socket: any, req: any) {
		this.id = ++Connection.counter;//NOTE - connection never has id equal 0
		this.socket = socket;
		this.req = req;

		console.log('Connection id:', this.id, ', ip:', this.client_ip);
	}

	private get client_ip(): string {
		return this.req.connection.remoteAddress.replace(/::ffff:/, '');
	}
	/*get ip(): string {
		return this.client_ip;
	}

	get user() {
		return this._user;
	}
	
	set user(_user: UserInfo | null) {
		if( (this._user = _user) )
			this._user.connection = this;
	}*/

	/*private close() {
		this.socket.close();
	}*/

	public getRoom() {
		if(!this.user)
			return null;
		return this.user.room;
	}

	private send(data: any) {//TODO - data type
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send(data);
	}

	public isInLobby() {
		return this.user && (!this.user.room || !this.user.room.game_process);
	}

	loginAsGuest() {
		this.user = UserInfo.createGuest();

		this.send(JSON.stringify({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		}));
	}

	loginAsUser(account_id: string, session_token: string, data: UserCustomData) {
		this.user = new UserInfo(UserInfo.nextUserId(), data, account_id, session_token);

		this.send(JSON.stringify({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		}));
	}

	updateUserData(fresh_data: UserCustomData | null) {
		if(!this.user)
			throw new Error('This connection has no user');

		if(fresh_data)
			this.user.updateData(fresh_data);

		this.send(JSON.stringify({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		}));
	}

	updateCurrentRoomData() {//sends user's current room data
		if(!this.user)
			throw new Error('This connection has no user');

		this.send(JSON.stringify({
			type: NetworkCodes.ON_CURRENT_ROOM_DATA,
			room: this.user.room ? this.user.room.toJSON() : null//NULL means that user left room
		}));
	}

	updateRoomListData(room: RoomInfo) {//send data for user's rooms list
		if(!this.user)
			throw new Error('This connection has no user');

		this.send(JSON.stringify({
			type: NetworkCodes.ON_SINGLE_LIST_ROOM_DATA,
			room: room.toJSON()
		}));
	}

	sendRoomsList(rooms_list: RoomInfo[]) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send(JSON.stringify({
			type: NetworkCodes.ON_ENTIRE_LIST_ROOMS_DATA,
			rooms: JSON.stringify(rooms_list.map(room => room.getData()))
		}));
	}
}

export default {
	add(socket: any, req: any) {
		let connection = new Connection(socket, req);
		connections.set(connection.id, connection);
		//console.log(connection.req.headers.cookie);
		return connection;
	},

	remove(connection: Connection) {
		//TODO - remove user from rooms

		if( !connections.delete(connection.id) )
			console.error('Cannot delete connection. Object not found in map structure.');
	},

	//users in lobby are users that are not in room or are in room but not during game
	forEachLobbyUser(func: (connection: Connection) => void) {
		connections.forEach(connection => {
			if( connection.isInLobby() )
				func(connection);
		});
	}
}