import UserInfo, {UserPublicData} from './user_info';
import Config from './config';
import Maps, {map_name} from './game/maps';

export const enum GAME_MODES {
	COOPERATION = 0,
	COMPETITION
}
const GAMEMODES_COUNT = 2;

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface RoomSettings {
	name: string;
	map: map_name;
	gamemode: GAME_MODES;
	duration: number;
	max_enemies: number;

	sits_number: number;
}

export interface RoomCustomData extends Omit<RoomSettings, 'sits_number'> {
	id: number;
	
	sits: number[];
	readys: boolean[];
}

export default class RoomInfo {
	private static room_id = 0;

	public readonly id: number;
	public name: string;

	public map = Config.DEFAULT_MAP;
	public duration = Config.DEFAULT_GAME_DURATION;
	public max_enemies = Config.DEFAULT_MAX_ENEMIES;
	public sits: number[] = new Array(Config.DEFAULT_SITS).fill(0);//0 means empty sit
	public readys: boolean[] = new Array(Config.DEFAULT_SITS).fill(false);
	//public users: UserInfo[] = [];
	private users: Map<number, UserInfo> = new Map();//contains UserInfo instances
	public gamemode: GAME_MODES = Config.DEFAULT_GAME_MODE;

	public to_remove = false;//client-side only user

	public banned_ips: Set<string> = new Set();//server-side only use (stores Connection's ip addresses)

	//if not null => game is running
	public game_handler: any | null = null;

	constructor(_id: number, _name: string) {
		this.id = _id;
		this.name = _name;

		if( !(this.map in Maps) ) {
			console.error('Given map name is not correct:', this.map);
			this.map = Object.keys(Maps)[0] as map_name;//fail-back to first map
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
			readys: this.readys,
			max_enemies: this.max_enemies
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
		room.max_enemies = json_data['max_enemies'];
		return room;
	}

	addUser(user: UserInfo) {
		user.room = this;
		this.users.set(user.id, user);//NOTE - if user is already in room - it will be overridden
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

	// noinspection JSUnusedGlobalSymbols
	isUserReady(user_id: number) {
		let sit_id = this.sits.indexOf(user_id);
		return sit_id === -1 ? false : this.readys[sit_id];
	}

	everyoneReady() {
		return this.readys.every(r => r);
	}

	everyoneSits() {
		return this.sits.every(s => s !== 0);
	}

	getUserByID(user_id: number) {
		return this.users.get(user_id) || null;
	}

	// noinspection JSUnusedGlobalSymbols
	getSettings(): RoomSettings {
		return {
			name: this.name,
			map: this.map,
			gamemode: this.gamemode,
			duration: this.duration,
			sits_number: this.sits.length,
			max_enemies: this.max_enemies
		};
	}

	updateSettings(settings: RoomSettings) {
		this.duration = Math.max(Config.MINIMUM_GAME_DURATION, 
			Math.min(Config.MAXIMUM_GAME_DURATION, settings.duration));
		this.max_enemies = Math.max(10,
			Math.min(Config.MAXIMUM_ENEMIES_LIMIT, settings.max_enemies));
		this.gamemode = Math.max(0, Math.min(GAMEMODES_COUNT-1, settings.gamemode));
		this.name = settings.name.substr(0, Config.MAXIMUM_ROOM_NAME_LENGTH);

		let min_sits = this.gamemode === GAME_MODES.COMPETITION ? 2 : 1;
		let new_sits_count = Math.max(min_sits, Math.min(Config.MAXIMUM_SITS, settings.sits_number));
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
		this.readys = this.sits.map(() => false);
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
			this.max_enemies = json_data.max_enemies;
		}
		else {//update from JSON
			if(typeof json_data === 'string')//json
				json_data = JSON.parse(json_data) as RoomCustomData;

			if(this.id !== json_data['id'])
				throw Error('id mismatch');
			this.name = json_data['name'];
			this.sits = json_data['sits'];
			this.readys = json_data['readys'];
			this.map = json_data['map'];
			this.gamemode = json_data['gamemode'];
			this.duration = json_data['duration'];
			this.max_enemies = json_data['max_enemies'];
		}
	}

	sitUser(user: UserInfo) {
		if( this.sits.some(sit => sit === user.id) ) {
			console.log('User already sitting (' + user + ')');
			return;
		}
		for(let i=0; i<this.sits.length; i++) {
			if(this.sits[i] === 0) {//first empty sit
				this.sits[i] = user.id;//sitting user on it
				break;
			}
		}
	}

	standUpUser(user: UserInfo) {
		this.sits = this.sits.map(sit => (sit === user.id) ? 0 : sit)
			.sort((a) => a === 0 ? 1 : -1);
		this.unreadyAll();
	}

	unreadyAll() {
		for(let i=0; i<this.readys.length; i++)
			this.readys[i] = false;
	}

	setUserReady(user: UserInfo) {
		if( !this.sits.every(sit => sit !== 0) )//not every sit taken
			return false;
		for(let i=0; i<this.sits.length; i++) {
			if( this.sits[i] === user.id && !this.readys[i] ) {
				this.readys[i] = true;
				return true;
			}
		}

		return false;
	}
}