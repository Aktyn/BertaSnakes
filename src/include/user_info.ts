//const UserInfo = (function() {
// var guest_id = -1000;//NOTE that guests ids are negative

// const INITIAL_RANK = 1000;//new account's rank

interface UserCustomData {
	nick: string;
	level: number;
	rank: number;
	exp: number;
	coins: number;
	ship_type: number;
	skills: (number | null)[];
	avaible_ships: number[];
	avaible_skills: number[];
}

interface FriendInfoI {
	id: number;
	nick: string;
	online?: boolean;
}

interface UserJsonI {
	id: number;
	nick: string;
	level: number;
	rank: number;

	[index: string]: number | string;
}

class UserInfo {
	private static guest_id = -1000;

	private static INITIAL_RANK = 1000;

	private _id: number;
	
	public custom_data: UserCustomData;
	public friends: FriendInfoI[];

	public nick: string;

	public connection: any = null;
	public room: RoomInfo | null = null;

	public lobby_subscriber = false;

	//@id - database id for registered accounts
	constructor(id?: number, nick?: string, custom_data?: any) {
		this._id = id || 0;
		if(this._id === 0) {//is guest
			this._id = UserInfo.guest_id--;
			this.nick = "Guest#" + Math.abs(this._id);
		}
		else if(nick)
			this.nick = nick;
		else
			this.nick = 'Error#69';

		try {
			if(typeof custom_data === 'string')
				custom_data = JSON.parse(custom_data);
			else if(typeof custom_data !== 'object') {
				//console.error('custom_data must be a JSON format');
				custom_data = {};
			}
		}
		catch(e) {
			console.error(e);
			custom_data = {};
		}
		this.custom_data = custom_data;
		this.friends = [];

		//filling data gaps with default values

		//NOTE - level is never 0
		this.custom_data['level'] = this.custom_data['level'] || this.custom_data.level || 1;
		this.custom_data['rank'] = 
			this.custom_data['rank'] || this.custom_data.rank || UserInfo.INITIAL_RANK;
		this.custom_data['exp'] = this.custom_data['exp'] || this.custom_data.exp || 0;
		this.custom_data['coins'] = this.custom_data['coins'] || this.custom_data.coins || 0;
		this.custom_data['ship_type'] = 
			this.custom_data['ship_type'] || this.custom_data.ship_type || 0;
		this.custom_data['skills'] = this.custom_data['skills'] || this.custom_data.skills || 
			[null, null, null, null, null, null];

		this.custom_data['avaible_ships'] = 
			this.custom_data['avaible_ships'] || this.custom_data.avaible_ships || [0];
		this.custom_data['avaible_skills'] = 
			this.custom_data['avaible_skills'] || this.custom_data.avaible_skills || [];

		//this.level = custom_data['level'] || 1;

		//this.lobby_subscriber = false;

		//use only serverside
		// this.connection = null;
		// this.room = null;
	}

	//STORES ONLY PUBLIC DATA
	toJSON() {
		return JSON.stringify({
			id: this.id,
			nick: this.nick,
			level: this.level,//this.level
			rank: this.rank
		});
	}

	//GETS ONLY PUBLIC DATA
	static fromJSON(json_data: string | UserJsonI) {
		if(typeof json_data === 'string')
			json_data = <UserJsonI>JSON.parse(json_data);
		
		return new UserInfo(json_data['id'], json_data['nick'], {
			level: json_data['level'],
			rank: json_data['rank']
		});
	}

	//PRIVATE AND PUBLIC DATA (for server-side threads comunications)
	toFullJSON() {
		return JSON.stringify({
			id: this.id,
			nick: this.nick,
			custom_data: this.custom_data,//this.level
			friends: this.friends,
			lobby_subscriber: this.lobby_subscriber
		});
	}

	//PRIVATE AND PUBLIC ...
	static fromFullJSON(full_json_data: any) {
		if(typeof full_json_data === 'string')
			full_json_data = JSON.parse(full_json_data);
		
		let user = new UserInfo(full_json_data['id'], full_json_data['nick'], 
			full_json_data['custom_data']);
		user.friends = full_json_data['friends'];
		user.lobby_subscriber = full_json_data['lobby_subscriber'];
		return user;
	}

	/*get lobby_subscriber() {
		return this._lobby_subscriber;
	}

	set lobby_subscriber(value) {
		this._lobby_subscriber = value;
	}*/

	isGuest() {
		return this._id < 0;
	}

	get id() {
		return this._id;
	}

	set id(val) {
		throw new Error('User id cannot be changed');
	}

	/*get nick() {
		return this._nick;
	}

	set nick(_nick) {
		this._nick = _nick || '';
	}*/

	get level() {//deprecated
		return this.custom_data['level'] || 1;//this._level;
	}

	getLevel() {
		return this.custom_data['level'] || 1;
	}

	set level(_level) {
		//this.custom_data['level'] = _level;
		throw new Error('Level can be changed only through custom_data');
	}

	get rank() {
		return this.custom_data['rank'] || UserInfo.INITIAL_RANK;
	}

	getRank() {
		return this.custom_data['rank'] || UserInfo.INITIAL_RANK;
	}

	set rank(value) {
		throw new Error('User\'s rank can be changed only through custom_data');
	}
}
// })();

// module.exports = UserInfo;
// export default UserInfo;
//------------------------------------------------------//

try {//export for NodeJS
	module.exports = UserInfo;
}
catch(e) {}
