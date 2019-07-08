import RoomInfo from './room_info';
import Config from './config';
import {Connection} from '../server/game/connections';
import {PLAYER_TYPES} from "./game/objects/player";

export interface UserPublicData {
	nick: string;
	level: number;
	rank: number;
	avatar: string | null;

	skills: (number | null)[];//chosen skills
	ship_type: PLAYER_TYPES;//chosen ship
	
	total_games: number;
}

export interface UserPrivateData {
	verified: boolean;

	exp: number;
	coins: number;
	
	available_skills: number[];
	available_ships: PLAYER_TYPES[];
}

export interface UserCustomData extends UserPublicData, UserPrivateData {}

export interface UserFullData {
	id: number;
	account_id?: string;
	data: UserCustomData;
}

const TIMESTAMP_SAMPLES = 10;

export default class UserInfo {
	private static guest_id = -1000;
	private static user_id = 0;

	readonly id: number;
	readonly account_id?: string;
	readonly session_token?: string;

	public custom_data: UserPublicData & Partial<UserCustomData>;
	//public friends: FriendInfoI[];

	public connection: Connection | null = null;//only server-side use
	public room: RoomInfo | null = null;//only server-side use
	private message_timestamps: number[] = [];//only server-side use

	//public lobby_subscriber = false;

	//@id - database id for registered accounts
	constructor(_id: number, _custom_data: UserPublicData | UserCustomData, _account_id?: string,
		_session_token?: string) 
	{
		this.id = _id;
		if(this.id === 0)
			throw new Error('Creating guest this way is deprecated. Use UserInfo.createGuest() instead');

		this.account_id = _account_id;
		this.session_token = _session_token;

		//console.log(this.account_id, this.session_token);

		this.custom_data = _custom_data;
	}

	public static createGuest() {
		let id = this.nextGuestId();
		return new UserInfo(id, {
			nick: "Guest#" + Math.abs(id),
			level: 1,
			rank: Config.INITIAL_RANK,
			avatar: null,

			verified: false,
			exp: 0,
			coins: 0,
			
			available_skills: [],//no skills available initially
			skills: new Array(Config.SKILLS_SLOTS).fill(null),

			available_ships: [0],//first ship is available for everyone
			ship_type: 0,//and selected by default
			
			total_games: 0
		} as UserCustomData);
	}

	public static nextUserId() {
		return ++UserInfo.user_id;
	}
	
	private static nextGuestId() {
		return UserInfo.guest_id--;
	}

	public isGuest() {
		return this.id < 0;
	}

	public get nick() {
		return this.custom_data.nick;
	}

	public get avatar() {
		return this.custom_data.avatar;
	}

	public get rank() {
		return this.custom_data.rank;
	}

	public get level() {
		return this.custom_data.level;
	}

	public getPublicData(): UserPublicData {
		return {
			nick: this.custom_data.nick,
			level: this.custom_data.level,
			rank: this.custom_data.rank,
			avatar: this.custom_data.avatar,
			skills: this.custom_data.skills,
			ship_type: this.custom_data.ship_type,
			total_games: this.custom_data.total_games
		};
	}

	//RETURNS ONLY PUBLIC DATA AND ID's
	public toJSON() {
		return {
			id: this.id,
			account_id: this.account_id,
			data: this.getPublicData()
		};
	}

	//GETS ONLY PUBLIC DATA AND ID
	public static fromJSON(json_data: string | {id:number, account_id?:string, data:UserPublicData}) {
		if(typeof json_data === 'string')
			json_data = <{id: number, account_id?: string, data: UserPublicData}>JSON.parse(json_data);
		
		let public_data = json_data['data'];
		public_data = {
			nick: public_data['nick'],
			level: public_data['level'],
			rank: public_data['rank'],
			avatar: public_data['avatar'],
			skills: public_data['skills'],
			ship_type: public_data['ship_type'],
			total_games: public_data['total_games']
		};
		return new UserInfo(json_data['id'], public_data, json_data['account_id']);
	}

	//PRIVATE AND PUBLIC DATA (for server-side threads communications)
	public toFullJSON(): UserFullData {
		return {
			id: this.id,
			account_id: this.account_id,
			data: <UserCustomData>this.custom_data
		};
	}

	//PRIVATE AND PUBLIC ...
	static fromFullJSON(full_json_data: string | UserFullData) {
		if(typeof full_json_data === 'string') {
			full_json_data = 
				<{id: number, account_id?: string, data: UserCustomData}>JSON.parse(full_json_data);
		}

		let full_data = full_json_data['data'];
		full_data = {
			nick: full_data['nick'],
			level: full_data['level'],
			rank: full_data['rank'],
			avatar: full_data['avatar'],

			verified: full_data['verified'],
			exp: full_data['exp'],
			coins: full_data['coins'],
			available_skills: full_data['available_skills'],
			skills: full_data['skills'],
			available_ships: full_data['available_ships'],
			ship_type: full_data['ship_type'],
			
			total_games: full_data['total_games']
		};

		//user.friends = full_json_data['friends'];
		//user.lobby_subscriber = full_json_data['lobby_subscriber'];
		return new UserInfo(full_json_data['id'], full_data, full_json_data['account_id']);
	}

	public updateData(fresh_data: UserCustomData) {
		//nick should never change so it is commented
		//this.custom_data.nick = fresh_data['nick'];
		this.custom_data.level = fresh_data['level'];
		this.custom_data.rank = fresh_data['rank'];
		this.custom_data.avatar = fresh_data['avatar'];

		this.custom_data.verified = fresh_data['verified'];
		this.custom_data.exp = fresh_data['exp'];
		this.custom_data.coins = fresh_data['coins'];
		this.custom_data.available_skills = fresh_data['available_skills'];
		this.custom_data.skills = fresh_data['skills'];
		this.custom_data.available_ships = fresh_data['available_ships'];
		this.custom_data.ship_type = fresh_data['ship_type'];
		
		this.custom_data.total_games = fresh_data['total_games'];
	}
	
	public canSendChatMessage() {//server-side only for anti-spam system
		return this.message_timestamps.length < TIMESTAMP_SAMPLES ||
			(Date.now() - this.message_timestamps[0]) > TIMESTAMP_SAMPLES*1000;//one second per message
	}
	
	public registerLastMessageTimestamp(timestamp: number) {//server-side only for anti-spam system
		this.message_timestamps.push(timestamp);
		while( this.message_timestamps.length > TIMESTAMP_SAMPLES )//store last N message timestamps
			this.message_timestamps.shift();
	}
}
