import RoomInfo from './room_info';
import Config from './config';

export interface UserPublicData {
	nick: string;
	level: number;
	rank: number;
	avatar: string | null;
}

export interface UserPrivateData {
	verified: boolean;

	exp: number;
	coins: number;
	
	available_skills: number[];
	skills: (number | null)[];//chosen skills

	available_ships: number[];
	ship_type: number;//chosen ship
}

export interface UserCustomData extends UserPublicData, UserPrivateData {}

/*export interface FriendInfoI {
	id: number;
	nick: string;
	online?: boolean;
}

export interface UserJsonI {
	id: number;
	nick: string;
	avatar: string | null;
	level: number;
	rank: number;

	[index: string]: number | string | null;
}*/

export default class UserInfo {
	private static guest_id = -1000;
	private static user_id = 0;

	readonly id: number;
	readonly account_id?: string;
	readonly session_token?: string;

	public custom_data: UserPublicData & Partial<UserCustomData>;
	//public friends: FriendInfoI[];

	public connection: any = null;
	public room: RoomInfo | null = null;

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

		//use only server-side
		// this.connection = null;
		// this.room = null;
	}

	public static createGuest() {
		let id = UserInfo.guest_id--;

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
			ship_type: 0//and selected by default
		} as UserCustomData);
	}

	public static nextUserId() {
		return ++UserInfo.user_id;
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

	private getPublicData(): UserPublicData {
		return {
			nick: this.custom_data.nick,
			level: this.custom_data.level,
			rank: this.custom_data.rank,
			avatar: this.custom_data.avatar
		};
	}

	//RETURNS ONLY PUBLIC DATA AND ID
	public toJSON() {
		return JSON.stringify({
			id: this.id,
			data: this.getPublicData()
		});
	}

	//GETS ONLY PUBLIC DATA AND ID
	public static fromJSON(json_data: string | {id: number, data: UserPublicData}) {
		if(typeof json_data === 'string')
			json_data = <{id: number, data: UserPublicData}>JSON.parse(json_data);
		
		let public_data = json_data['data'];
		public_data = {
			nick: public_data['nick'],
			level: public_data['level'],
			rank: public_data['rank'],
			avatar: public_data['avatar']
		};
		return new UserInfo(json_data['id'], public_data);
	}

	//PRIVATE AND PUBLIC DATA (for server-side threads communications)
	public toFullJSON() {
		return JSON.stringify({
			id: this.id,
			data: this.custom_data
		});
	}

	//PRIVATE AND PUBLIC ...
	static fromFullJSON(full_json_data: string | {id: number, data: UserCustomData}) {
		if(typeof full_json_data === 'string')
			full_json_data = <{id: number, data: UserCustomData}>JSON.parse(full_json_data);

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
			ship_type: full_data['ship_type']
		};

		let user = new UserInfo(full_json_data['id'], full_data);

		//user.friends = full_json_data['friends'];
		//user.lobby_subscriber = full_json_data['lobby_subscriber'];
		return user;
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
	}
}
