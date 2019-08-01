import UserInfo, {UserCustomData} from '../../common/user_info';
import RoomInfo, {RoomCustomData} from '../../common/room_info';

import NetworkCodes, {NotificationCodes} from '../../common/network_codes';
import SocialConnection from "../social/social_connection";
import {extractIP} from "../utils";

let connections: Map<number, Connection> = new Map();

export class Connection {
	private static counter = 0;
	readonly id: number;
	readonly socket: any;
	//private req: any;
	public readonly client_ip: string;
	public user: UserInfo | null = null;

	constructor(socket: any, req: any) {
		this.id = ++Connection.counter;//NOTE - connection never has id equal 0
		this.socket = socket;
		//this.req = req;
		this.client_ip = extractIP(req);

		console.log('Connection id:', this.id, ', ip:', this.client_ip);
	}
	
	/*private close() {
		this.socket.close();
	}*/

	public getRoom() {
		if(!this.user)
			return null;
		return this.user.room;
	}

	//stringifies serializable object before sending over socket
	private send<T>(data: T & Exclude<T, string>) {//stringified json
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send( JSON.stringify(data) );
	}

	public sendCustom<T>(data: 
		{[index: string]: (T & Exclude<T, string>)} & {type: NetworkCodes}) 
	{
		this.send(data);
		if(data.type === NetworkCodes.END_GAME && this.user && this.user.account_id)
			Connection.updateSocialIsPlayingState(this.user.account_id, false);
	}

	public sendBuffer(buffer: Float32Array) {
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send(buffer);
	}

	public isInLobby() {
		return this.user && (!this.user.room || !this.user.room.game_handler);
	}
	
	private static updateSocialRoomData(account_id: string, room_data: RoomCustomData | null) {
		let social_connections = SocialConnection.getConnections(account_id);
		if(social_connections) {
			let distributed = false;
			for(let conn of social_connections) {
				conn.updateRoomData(room_data, distributed);
				distributed = true;
			}
		}
	}
	
	private static updateSocialIsPlayingState(account_id: string, is_playing: boolean) {
		let social_connections = SocialConnection.getConnections(account_id);
		if(social_connections) {
			let distributed = false;
			for(let conn of social_connections) {
				conn.updatePlayingState(is_playing, distributed);
				distributed = true;
			}
		}
	}

	loginAsGuest() {
		this.user = UserInfo.createGuest();
		this.user.connection = this;

		this.send({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		});
	}

	loginAsUser(account_id: string, session_token: string, data: UserCustomData) {
		this.user = new UserInfo(UserInfo.nextUserId(), data, account_id, session_token);
		this.user.connection = this;

		this.send({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		});
	}

	updateUserData(fresh_data: UserCustomData | null) {
		if(!this.user)
			throw new Error('This connection has no user');

		if(fresh_data)
			this.user.updateData(fresh_data);

		this.send({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		});
	}
	
	sendNotification(code: NotificationCodes) {
		if(!this.user)
			throw new Error('This connection has no user');
		this.send({type: NetworkCodes.NOTIFICATION, code});
	}

	sendRoomsList(rooms_list: RoomInfo[]) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_ENTIRE_LIST_ROOMS_DATA,
			rooms: rooms_list.map(room => room.toJSON())
		});
	}

	sendKickInfo(room: RoomInfo) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_KICKED_FROM_ROOM,
			room_name: room.name
		});
	}

	sendAccountAlreadyLoggedInError() {
		this.send({
			type: NetworkCodes.ACCOUNT_ALREADY_LOGGED_IN,
		});
	}

	onRoomCreated(room: RoomInfo) {//send data for user's rooms list
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_ROOM_CREATED,
			room: room.toJSON()
		});
	}

	onRoomRemove(room: RoomInfo) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_ROOM_REMOVED,
			room_id: room.id
		});
	}

	onRoomUpdate(room: RoomInfo) {
		if(!this.user)
			throw new Error('This connection has no user');

		let room_data = room.toJSON();
		this.send({
			type: NetworkCodes.ON_ROOM_DATA_UPDATE,
			room: room_data
		});
		
		if( this.user.account_id )
			Connection.updateSocialRoomData(this.user.account_id, room_data);
	}

	onRoomJoined() {//sends user's current room data
		if(!this.user)
			throw new Error('This connection has no user');
		if(!this.user.room)
			throw new Error('User has no room assigned');

		let room_data = this.user.room.toJSON();
		this.send({
			type: NetworkCodes.ON_ROOM_JOINED,
			room: room_data,
			users: this.user.room.getUsersPublicData()
		});
		
		if( this.user.account_id )
			Connection.updateSocialRoomData(this.user.account_id, room_data);
	}

	onRoomLeft(left_room_id: number) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_ROOM_LEFT,
			room_id: left_room_id
		});
		
		if( this.user.account_id )
			Connection.updateSocialRoomData(this.user.account_id, null);
	}

	onUserLeftRoom(user_id: number, room_id: number) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_USER_LEFT_ROOM,
			user_id,
			room_id
		});
	}

	onUserJoinedRoom(user: UserInfo, room_id: number) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_USER_JOINED_ROOM,
			user: user.toJSON(),
			room_id: room_id
		});
	}

	sendRoomMessage(room_id: number, author_id: number, timestamp: number, content: string) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.ON_ROOM_MESSAGE,
			room_id,
			author_id,
			timestamp,
			content
		});
	}
	
	sendSpamWarning(room_id: number) {
		if(!this.user)
			throw new Error('This connection has no user');
		this.send({type: NetworkCodes.SPAM_WARNING, room_id});
	}

	sendCountdown(room_id: number, time: number | null) {
		if(!this.user)
			throw new Error('This connection has no user');

		this.send({
			type: NetworkCodes.GAME_COUNTDOWN_UPDATE,
			room_id,
			time
		});
	}

	sendOnGameStartEvent(room: RoomInfo) {
		if(!this.user)
			throw new Error('This connection has no user');
		this.send({
			type: NetworkCodes.ON_GAME_START,
			room_id: room.id,
		});
		if( this.user.account_id )
			Connection.updateSocialIsPlayingState(this.user.account_id, true);
	}

	sendGameStartFailEvent(room: RoomInfo) {
		if(!this.user)
			throw new Error('This connection has no user');
		this.send({
			type: NetworkCodes.ON_GAME_FAILED_TO_START,
			room: room.toJSON(),
		});
	}
}

export default {
	add(socket: any, req: any) {
		let connection = new Connection(socket, req);
		connections.set(connection.id, connection);
		//console.log(connection.req.headers.cookie);
		return connection;
	},
	
	getSize() {
		return connections.size;
	},

	remove(connection: Connection) {
		if(connection.user)
			connection.user.connection = null;
		if( !connections.delete(connection.id) )
			console.error('Cannot delete connection. Object not found in map structure.');
	},
	
	findAccount(account_id: string) {
		for(let [, conn] of connections) {
			if(conn.user && conn.user.account_id === account_id)
				return conn.user;
		}
		return undefined;
	},

	//users in lobby are users that are not in room or are in room but not during game
	forEachLobbyUser(func: (connection: Connection) => void) {
		connections.forEach(connection => {
			if( connection.isInLobby() )
				func(connection);
		});
	},

	forEachAccountUser(func: (connection: Connection) => void) {//each logged in user
		connections.forEach(connection => {
			if( connection.user && connection.user.account_id )
				func(connection);
		});
	}
}