import UserInfo from './user_info';
import Config from './config';
import Maps from './game/maps';

export const enum GAME_MODES {
	COOPERATION,
	COMPETITITON
}

export interface RoomCustomData {
	id: number;
	name: string;
	map: string;
	gamemode: GAME_MODES;
	duration: number;
	sits: number[];
	readys: boolean[];
}

export default class RoomInfo {
	private static room_id = 0;

	//private static DEFAULT_MAP = 'Simple Maze';//'Empty', 'Open Maze', 'Simple Maze', 'Snowflake'

	readonly id: number;
	readonly name: string;

	public map = Config.DEFAULT_MAP;
	public duration = Config.DEFAULT_GAME_DURATION;
	public sits = new Array(Config.DEFAULT_SITS).fill(0);//0 means empty sit
	public readys = new Array(Config.DEFAULT_SITS).fill(false);
	public users: UserInfo[] = [];
	public gamemode = Config.DEFAULT_GAME_MODE;

	// public onUserConfirm: ((user_id: number) => void) | null = null;

	//if not null => game is running
	public game_process: any = null;//TODO - set type of ChildProcess

	constructor(_id: number, _name: string) {
		this.id = _id;
		this.name = _name;

		this.users = [];//contains UserInfo instances

		if( !(this.map in Maps) ) {
			console.error('Given map name is not correct:', this.map);
			this.map = Object.keys(Maps)[0];//failback to first map
		}
		//use only serverside
		//this.confirmations = null;//if not null => waiting for confirmations before start
		//this.onUserConfirm = null;//handle to callback
	}

	public static nextRoomId() {
		return ++RoomInfo.room_id;
	}

	public getData(): RoomCustomData {
		return {
			id: this.id,
			name: this.name,
			map: this.map,
			gamemode: this.gamemode,
			duration: this.duration,
			sits: this.sits,
			readys: this.readys
		};
	}

	toJSON(): string {
		return JSON.stringify( this.getData() );
	}

	static fromJSON(json_data: string | RoomCustomData) {
		if(typeof json_data === 'string')
			json_data = <RoomCustomData>JSON.parse(json_data);
		
		let room = new RoomInfo(json_data['id'], json_data['name']);
		if(typeof json_data['sits'] === 'string') {
			json_data['sits'] = <never>JSON.parse(json_data['sits']);
		}
		room.sits = json_data['sits'];
		room.readys = json_data['readys'];
		room.map = json_data['map'];
		room.gamemode = json_data['gamemode'];
		room.duration = json_data['duration'];
		return room;
	}

	addUser(user: UserInfo) {
		if( this.users.find(u => u.id === user.id) )//user already in room - do not duplticate entry
			return;
		user.room = this;
		this.users.push(user);
	}

	getTakenSits() {
		let counter = 0;
		for(let sit of this.sits)
			if(sit !== 0) counter++;
		return counter;
		//return this.sits.filter(sit => sit !== 0).length || 0;
	}

	/*updateData(json_data: RoomInfo | string | RoomCustomData) {
		if(json_data instanceof RoomInfo) {//update from RoomInfo instance
			if(this.id !== json_data.id)
				throw Error('id mismatch');
			this.name = json_data.name;
			this.sits = json_data.sits;
			this.readys = json_data.readys;
			this.map = json_data.map;
			this.gamemode = json_data.gamemode;
			this.duration = json_data.duration;
		}
		else {//update from JSON
			if(typeof json_data === 'string')//json
				json_data = <RoomCustomData>JSON.parse(json_data);

			if(this.id !== json_data['id'])
				throw Error('id mismatch');
			this.name = json_data['name'];
			this.sits = json_data['sits'];
			this.readys = json_data['readys'];
			this.map = json_data['map'];
			this.gamemode = json_data['gamemode'];
			this.duration = json_data['duration'];
		}
	}

	get id() {
		return this._id;
	}

	set id(val) {
		throw new Error('RoomInfo id cannot be changed');
	}

	get taken_sits() {//returns number (deprecated)
		return this.sits.filter(sit => sit !== 0).length;
	}

	getUserByID(user_id: number) {
		for(let user of this.users) {
			if(user.id === user_id)
				return user;
		}
		return null;
	}

	getOwner() {//returns room owner (first user in list)
		if(this.users.length > 0)
			return this.users[0];
		return undefined;//empty room has no owner
	}

	changeSitsNumber(sits_number: number) {
		while(this.sits.length > sits_number)//removing last sits
			this.sits.pop();
		while(this.sits.length < sits_number)
			this.sits.push(0);

		this.readys = this.sits.map(sit => false);//unready all sitter and keeps array same size
	}

	isUserSitting(user_id: number) {
		return this.sits.some(u => (u !== 0) ? (u === user_id) : false);
	}

	isUserReady(user_id: number) {
		var sit_id = this.sits.indexOf(user_id);
		return sit_id === -1 ? false : this.readys[sit_id];
	}

	sitUser(user: number) {
		if(this.sits.some(sit => sit === user) === true) {
			console.log('User already sitting (' + user + ')');
			return;
		}
		for(let i in this.sits) {
			if(this.sits[i] === 0) {//first empty sit
				this.sits[i] = user;//sitting user on it
				break;
			}
		}
	}

	standUpUser(user: number) {
		this.sits = this.sits.map(sit => (sit === user) ? 0 : sit)
			.sort((a, b) => a === 0 ? 1 : -1);
		this.unreadyAll();
	}

	setUserReady(user: number) {
		if(this.sits.every(sit => sit !== 0) === false)//not every sit taken
			return false;
		for(let i in this.sits) {
			if(this.sits[i] === user && this.readys[i] === false) {
				this.readys[i] = true;
				return true;
			}
		}

		return false;
	}

	unreadyAll() {
		for(var i in this.readys)
			this.readys[i] = false;
	}

	everyoneReady() {
		return this.readys.every(r => r === true);
	}

	removeUser(user: number | UserInfo): boolean {
		if(typeof user === 'number') {//user id
			for(let u of this.users) {
				if(u.id === user)
					return this.removeUser(u);
			}
			return false;
		}
		let i = this.users.indexOf(user);
		if(i > -1) {
			if(this.sits.indexOf(user.id) !== -1)//user is sitting
				this.standUpUser(user.id);//releasing this sit
			user.room = null;
			this.users.splice(i, 1);
			return true;
		}
		return false;
	}*/
}