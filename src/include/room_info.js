const RoomInfo = (function() {
	var id = 0;

	const DEFAULT_SITS = 1;//
	const DEFAULT_MAP = 'Open Maze';//'Empty';
	const DEFAULT_DURATION = 180;//seconds

	const GAME_MODES = {//@enum
		COOPERATION: 0,
		COMPETITION: 1
	};

	return class {
		constructor(_id, _name) {
			this._id = _id || ++id;
			this.name = _name || ("#" + this.id);
			this.map = DEFAULT_MAP;//name of chosen map
			this.duration = DEFAULT_DURATION;//game duration in seconds
			// + Array(~~(Math.random()*15)).fill().map(x => 'x').join('');
			this.sits = [];//NOTE - stores only users ids and zeros (in case of empty sit)
			for(let i=0; i<DEFAULT_SITS; i++)
				this.sits.push(0);
			//stores booleans - true corresponds to ready user (same order as sits)
			this.readys = this.sits.map(sit => false);
			this.users = [];//contains UserInfo instances

			this.gamemode = GAME_MODES.COOPERATION;//default

			//use only serverside
			//this.confirmations = null;//if not null => waiting for confirmations before start
			this.onUserConfirm = null;//handle to callback
			this.game_process = null;//if not null => game is running
		}

		toJSON() {
			return JSON.stringify({
				id: this.id,
				name: this.name,
				map: this.map,
				gamemode: this.gamemode,
				duration: this.duration,
				sits: this.sits,
				readys: this.readys
			});
		}

		static fromJSON(json_data) {
			if(typeof json_data === 'string')
				json_data = JSON.parse(json_data);
			
			let room = new RoomInfo(json_data['id'], json_data['name']);
			if(typeof json_data['sits'] === 'string')
				json_data['sits'] = JSON.parse(json_data['sits']);
			room.sits = json_data['sits'];
			room.readys = json_data['readys'];
			room.map = json_data['map'];
			room.gamemode = json_data['gamemode'];
			room.duration = json_data['duration'];
			return room;
		}

		updateData(json_data) {
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
					json_data = JSON.parse(json_data);

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

		get taken_sits() {//returns number
			return this.sits.filter(sit => sit !== 0).length;
		}

		getUserByID(user_id) {
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

		/*getSitsWithUserInfo() {//return array of nulls or UserInfo instances
			return this.sits.map(sit => {
				return sit === 0 ? null : this.getUserByID(sit);
			});
		}*/

		changeSitsNumber(number) {
			while(this.sits.length > number)//removing last sits
				this.sits.pop();
			while(this.sits.length < number)
				this.sits.push(0);

			this.readys = this.sits.map(sit => false);//unready all sitter and keeps array same size
		}

		isUserSitting(user) {
			if(typeof user === 'undefined')
				throw new Error('User not specified');
			if(user.id !== undefined)
				user = user.id;

			return this.sits.some(u => (u !== 0) ? (u === Number(user)) : false);
		}

		sitUser(user) {
			if(typeof user === 'undefined')
				throw new Error('User not specified');
			if(user.id !== undefined)
				user = user.id;
			if(this.sits.some(sit => sit === Number(user)) === true) {
				console.log('User already sitting (' + user + ')');
				return;
			}
			for(let i in this.sits) {
				if(this.sits[i] === 0) {//first empty sit
					this.sits[i] = Number(user);//sitting user on it
					break;
				}
			}
		}

		standUpUser(user) {
			if(typeof user === 'undefined')
				throw new Error('User not specified');
			if(user.id !== undefined)
				user = user.id;
			
			this.sits = this.sits.map(sit => (sit === Number(user)) ? 0 : sit)
				.sort((a, b) => a === 0 ? 1 : -1);
			this.unreadyAll();
		}

		setUserReady(user) {
			if(typeof user === 'undefined')
				throw new Error('User not specified');
			if(user.id !== undefined)
				user = user.id;
			if(this.sits.every(sit => sit !== 0) === false)//not every sit taken
				return false;
			for(let i in this.sits) {
				if(this.sits[i] === Number(user) && this.readys[i] === false) {
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

		addUser(user) {
			for(let u of this.users) {
				if(u.id === user.id) {//user already in room - do not duplticate entry
					user.room = this;
					return;
				}
			}
			this.users.push(user);
			user.room = this;
		}

		removeUser(user) {
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
					this.standUpUser(user);//releasing this sit
				user.room = null;
				this.users.splice(i, 1);
				return true;
			}
			return false;
		}

		static get GAME_MODES() {
			return GAME_MODES;
		}
	};
})();

//------------------------------------------------------//

try {//export for NodeJS
	module.exports = RoomInfo;
}
catch(e) {}