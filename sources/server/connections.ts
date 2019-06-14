import UserInfo, {UserCustomData} from './../common/user_info';
import {handleJSON} from './message_handler';
import NetworkCodes from '../common/network_codes';

let connections: Map<number, Connection> = new Map();

export class Connection {
	private static counter = 0;
	public id: number;
	private socket: any;
	public req: any;
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

	private send(data: any) {//TODO - data type
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send(data);
	}

	onMessage(message: any) {
		try {
			if(typeof message === 'string')//stringified JSON object
				handleJSON( this, JSON.parse(message) );
			else if(typeof message === 'object') {//object - propably array buffer
				/*if(this.user && this.user.room && this.user.room.game_process) {
					this.user.room.game_process.send( 
						{user_id: this.user.id, data: message} );
				}*/
			}
			else console.error('Message must by type of string or object');
		}
		catch(e) {
			console.log('Message handle error: ', e);
		}
	}

	loginAsGuest() {
		this.user = UserInfo.createGuest();

		this.send(JSON.stringify({
			type: NetworkCodes.ON_USER_DATA,
			user: this.user.toFullJSON()
		}));
	}

	loginAsUser(account_id: string, data: UserCustomData) {
		this.user = new UserInfo(UserInfo.nextUserId(), data, account_id);

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
}

export default {
	add(socket: any, req: any) {
		let connection = new Connection(socket, req);
		connections.set(connection.id, connection);
		//console.log(connection.req.headers.cookie);
		return connection;
	},

	remove(connection: Connection) {
		if( !connections.delete(connection.id) )
			console.error('Cannot delete connection. Object not found in map structure.');
	}
}