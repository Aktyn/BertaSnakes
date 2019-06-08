import UserInfo from './../common/user_info.js';

var id = 0;

export default class Connection {
	public id: number;
	private socket: any;
	public req: any;
	private _user: UserInfo | null = null;

	constructor(socket: any, req: any) {
		this.id = ++id;//NOTE - connection never has id equal 0
		this.socket = socket;
		this.req = req;

		//this._user = null;//new UserInfo();

		console.log('Connection id:', this.id, ', ip:', this.client_ip);
	}

	get client_ip(): string {
		return this.req.connection.remoteAddress.replace(/::ffff:/, '');
	}
	get ip(): string {
		return this.client_ip;
	}

	get user() {
		return this._user;
	}
	
	set user(_user: UserInfo | null) {
		if( (this._user = _user) )
			this._user.connection = this;
	}

	close() {
		this.socket.close();
	}

	send(data: any) {//TODO - data type
		if(this.socket.readyState !== 1)//socket not open
			return;
		this.socket.send(data);
	}
}