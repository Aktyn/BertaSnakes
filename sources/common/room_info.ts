import UserInfo, {UserPublicData} from './user_info';
import Config from './config';
import Maps from './game/maps';

export const enum GAME_MODES {
	COOPERATION = 0,
	COMPETITITON
}
const GAMEMODES_COUNT = 2;

export interface RoomSettings {
	name: string;
	map: string;
	gamemode: number;
	duration: number;

	sits_number: number;
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
	public name: string;

	public map = Config.DEFAULT_MAP;
	public duration = Config.DEFAULT_GAME_DURATION;
	public sits: number[] = new Array(Config.DEFAULT_SITS).fill(0);//0 means empty sit
	public readys: boolean[] = new Array(Config.DEFAULT_SITS).fill(false);
	//public users: UserInfo[] = [];
	private users: Map<number, UserInfo> = new Map();//contains UserInfo instances
	public gamemode = Config.DEFAULT_GAME_MODE;

	// public onUserConfirm: ((user_id: number) => void) | null = null;

	//if not null => game is running
	public game_process: any = null;//TODO - set type of ChildProcess

	constructor(_id: number, _name: string) {
		this.id = _id;
		this.name = _name;

		if( !(this.map in Maps) ) {
			console.error('Given map name is not correct:', this.map);
			this.map = Object.keys(Maps)[0];//fail-back to first map
		}
		//use only server-side
		//this.confirmations = null;//if not null => waiting for confirmations before start
		//this.onUserConfirm = null;//handle to callback
	}

	public static nextRoomId() {
		return ++RoomInfo.room_id;
	}

	public forEachUser(func: (user: UserInfo, key: number) => void) {
		this.users.forEach( func );
	}

	public mapUsers<T>(func: (user: UserInfo, key: number) => T) {
		let out: T[] = [];
		this.users.forEach((_user, _key) => {
			out.push( func(_user, _key) );
		});
		return out;
	}

	public getUsersPublicData() {
		let data: {id: number, data: UserPublicData}[] = [];
		this.users.forEach( user => data.push(user.toJSON()) );
		return data;
	}

	toJSON(): RoomCustomData {
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
		user.room = this;
		this.users.set(user.id, user);
	}

	removeUser(user: UserInfo) {
		//user may be sitting - so his sit becomes free
		if( this.sits.some(s => s === user.id) )
			this.standUpUser(user);

		user.room = null;
		this.users.delete(user.id);
	}

	removeUserById(user_id: number) {
		let user = this.users.get(user_id);
		if(user)
			this.removeUser(user);
	}

	isEmpty() {
		return this.users.size === 0;
	}

	getTakenSits() {
		let counter = 0;
		for(let sit of this.sits)
			if(sit !== 0) counter++;
		return counter;
		//return this.sits.filter(sit => sit !== 0).length || 0;
	}

	getOwner(): UserInfo | undefined {//returns room owner (first user in list)
		return this.users.values().next().value;
	}

	isUserSitting(user_id: number) {
		// return this.sits.some(u => (u !== 0) ? (u === user_id) : false);
		return this.sits.some(u => u === user_id);
	}

	isUserReady(user_id: number) {
		var sit_id = this.sits.indexOf(user_id);
		return sit_id === -1 ? false : this.readys[sit_id];
	}

	everyoneReady() {
		return this.readys.every(r => r === true);
	}

	getUserByID(user_id: number) {
		return this.users.get(user_id) || null;
	}

	getSettings(): RoomSettings {
		return {
			name: this.name,
			map: this.map,
			gamemode: this.gamemode,
			duration: this.duration,
			sits_number: this.sits.length
		};
	}

	updateSettings(settings: RoomSettings) {
		this.duration = Math.max(Config.MINIMUM_GAME_DURATION, 
			Math.min(Config.MAXIMUM_GAME_DURATION, settings.duration));
		this.gamemode = Math.max(0, Math.min(GAMEMODES_COUNT-1, settings.gamemode));
		this.name = settings.name.substr(0, Config.MAXIMUM_ROOM_NAME_LENGTH);

		let new_sits_count = Math.max(1, Math.min(Config.MAXIMUM_SITS, settings.sits_number));
		this.changeSitsNumber(new_sits_count);

		if(settings.map in Maps)
			this.map = settings.map;
	}

	private changeSitsNumber(sits_number: number) {
		while(this.sits.length > sits_number)//removing last sits
			this.sits.pop();
		while(this.sits.length < sits_number)
			this.sits.push(0);

		//unready all sitting users and keeps array same size
		this.readys = this.sits.map(sit => false);
	}

	updateData(json_data: RoomInfo | string | RoomCustomData) {
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

	sitUser(user: UserInfo) {
		if(this.sits.some(sit => sit === user.id) === true) {
			console.log('User already sitting (' + user + ')');
			return;
		}
		for(var i=0; i<this.sits.length; i++) {
			if(this.sits[i] === 0) {//first empty sit
				this.sits[i] = user.id;//sitting user on it
				break;
			}
		}
	}

	standUpUser(user: UserInfo) {
		this.sits = this.sits.map(sit => (sit === user.id) ? 0 : sit)
			.sort((a, b) => a === 0 ? 1 : -1);
		this.unreadyAll();
	}

	unreadyAll() {
		for(var i=0; i<this.readys.length; i++)
			this.readys[i] = false;
	}

	setUserReady(user: UserInfo) {
		if(this.sits.every(sit => sit !== 0) === false)//not every sit taken
			return false;
		for(var i=0; i<this.sits.length; i++) {
			if(this.sits[i] === user.id && this.readys[i] === false) {
				this.readys[i] = true;
				return true;
			}
		}

		return false;
	}
	/*
	get taken_sits() {//returns number (deprecated)
		return this.sits.filter(sit => sit !== 0).length;
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