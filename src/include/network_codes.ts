interface NetworkPackage {
	type: number;
	[index: string]: any;
}

namespace _NetworkCodes_ {
	
	//enum NetworkCodes {
	export var self = {
		//TO SERVER
		SUBSCRIBE_LOBBY_REQUEST: 0,
		JOIN_ROOM_REQUEST: 0,//@id - 'number' (target room id)
		LEAVE_ROOM_REQUEST: 0,//@id - 'number' (current room id)
		CREATE_ROOM_REQUEST: 0,
		SEND_ROOM_MESSAGE: 0,//@msg - 'string'
		SEND_PRIVATE_MESSAGE: 0,//@msg - 'string', @user_id - 'number'
		ADD_FRIEND_REQUEST: 0,//@user_id - 'number'
		REMOVE_FRIEND_REQUEST: 0,// ----- // -----
		SIT_REQUEST: 0,
		STAND_REQUEST: 0,
		READY_REQUEST: 0,
		ACCOUNT_DATA_REQUEST: 0,
		SHIP_USE_REQUEST: 0,//@ship_type - 'number'
		SHIP_BUY_REQUEST: 0,// ------- // -------
		SKILL_BUY_REQUEST: 0,//@skill_id - 'number'
		SKILL_USE_REQUEST: 0,// ------- // -------
		SKILL_PUT_OFF_REQUEST: 0,// ------- // -------
		SKILLS_ORDER_REQUEST: 0,//@skills - array of skill indexes and nulls
		USER_KICK_REQUEST: 0,//@user_id - 'number'

		//@name - room name: 0, @map - map name: 0, @sits_number - number: 0, @duration - number in seconds
		ROOM_UPDATE_REQUEST: 0,
		START_GAME_CONFIRM: 0,

		//FROM SERVER
		PLAYER_ACCOUNT: 0,//gives user info to client (stored in @user_info property) (+ custom_data)
		ACCOUNT_DATA: 0,//complete user's custom_data + friends as an array
		TRANSACTION_ERROR: 0,//goes with error_detail (string)
		ADD_FRIEND_CONFIRM: 0,//goes with user_id
		REMOVE_FRIEND_CONFIRM: 0,// ----- // -----
		SUBSCRIBE_LOBBY_CONFIRM: 0,//goes with array of JSON RoomInfo's in @rooms property
		
		JOIN_ROOM_CONFIRM: 0,//goes with room users data (@users) and up to date room info (@room_info)
		CHANGE_ROOM_CONFIRM: 0,//@old_room_id - number: 0, @room_info - json format room info: 0, @users...
		LEAVE_ROOM_CONFIRM: 0,
		CREATE_ROOM_CONFIRM: 0,

		ON_KICKED: 0,

		USER_JOINED_ROOM: 0,//@user_info - JSON format of UserInfo
		USER_LEFT_ROOM: 0,//@user_id - number: 0, @room_info - JSON format of RoomInfo

		ON_ROOM_REMOVED: 0,//@room_id - 'number' (removed room id)
		ON_ROOM_CREATED: 0,//@room_info - JSON data of RoomInfo instance
		ON_ROOM_UPDATE: 0,//@room_info - JSON data of RoomInfo instance

		RECEIVE_CHAT_MESSAGE: 0,//@from - user nickname: 0, @public - boolean: 0, @msg - string message
		//RECEIVE_PRIVATE_MESSAGE: 0,// ----------------- // -----------------

		START_GAME_COUNTDOWN: 0,//@game_duration - duration in seconds
		START_GAME: 0,//after countdown finish
		START_GAME_FAIL: 0,//@room_info - JSON data of RoomInfo instance
		START_ROUND_COUNTDOWN: 0,//sends by server after every player confirms game loaded

		END_GAME: 0,

		// GAME CODES (vallue cannot be bigger then 255) //

		//SPECIAL
		START_ROUND_ACTION: 0,
		START_GAME_FAIL_ACTION: 0,
		END_GAME_ACTION: 0,//goes with 'result'
		SEND_DATA_TO_CLIENT_ACTION_FLOAT32: 0,

		//TO SERVER
		PLAYER_MOVEMENT: 0,//comes with player movement state
		PLAYER_EMOTICON: 0,//comes with emoticon index
		PLAYER_SKILL_USE_REQUEST: 0,//comes with skill index
		PLAYER_SKILL_STOP_REQUEST: 0,// -------- // --------

		//FROM SERVER
		OBJECT_SYNCHRONIZE: 0,//object_id: 0, sync_array_index: 0, pos_x: 0, pos_y: 0, rot
		DRAW_PLAYER_LINE: 0,//player_index: 0, pos_x: 0, pos_y: 0, player painter pos x and y
		ON_PLAYER_BOUNCE: 0,//player_index: 0, pos_x: 0, pos_y: 0, rot: 0, collision_x: 0, collision_y
		ON_ENEMY_BOUNCE: 0,//enemy_id: 0, pos_x: 0, pos_y: 0, rot: 0, collision_x: 0, collision_y
		ON_BULLET_BOUNCE: 0,//bullet_id -------------------- // --------------------
		ON_BULLET_HIT: 0,//bullet_id: 0, hit_x: 0, hit_y
		//PLAYER_UPDATE: 0,//player_id: 0, pos_x: 0, pos_y: 0, rot: 0, movement_state
		PLAYER_MOVEMENT_UPDATE: 0,//player_index: 0, player_rot: 0, movement state: 0, player_speed
		ON_PLAYER_EMOTICON: 0,//player_index: 0, emoticon_id
		WAVE_INFO: 0,//wave_number
		SPAWN_ENEMY: 0,//enemy_class_index: 0, object_id: 0, pos_x: 0, pos_y: 0, rot
		SPAWN_ITEM: 0,//item_id: 0, item_type: 0, item_x: 0, item_y
		//enemy_id: 0, player_index: 0, pos_x: 0, pos_y: 0, player_rot: 0, player_hp: 0, player_points: 0, bounce_x and y
		ON_PLAYER_ENEMY_COLLISION: 0,
		//ON_ENEMY_BULLET_COLLISION: 0,//enemy_id: 0, enemy_hp: 0, bullet_id: 0, player_index: 0, hit_x: 0, hit_y

		ON_ENEMY_ATTACKED: 0,//enemy_id: 0, damage: 0, player_index: 0, new_enemy_hp: 0, hit_x: 0, hit_y
		ON_PLAYER_ATTACKED: 0,//attacker_index: 0, damage: 0, victim_index: 0, new_victim_hp: 0, hit_x: 0, hit_y

		ON_BULLET_EXPLODE: 0,//bullet_id: 0, hit_x: 0, hit_y
		//ON_SMALL_EXPLOSION: 0,//pos_x: 0, pos_y

		ON_POISON_STAIN: 0,//stain_index: 0, pos_x: 0, pos_y: 0, size

		ON_PLAYER_COLLECT_ITEM: 0,//item_id: 0, item_type: 0, player_index
		ON_PLAYER_SPAWNING_FINISH: 0,//player_index: 0, pos_x: 0, pos_y
		//player_index: 0, spawning_duration: 0, death_pos_x: 0, death_pos_y: 0, explosion_radius
		ON_PLAYER_DEATH: 0,
		//player_index: 0, player_x: 0, player_y: 0, player_hp: 0, player_points
		ON_PLAYER_ENEMY_PAINTER_COLLISION: 0,

		ON_PLAYER_SKILL_USE: 0,//player_index: 0, skill_index: 0, player_energy
		ON_PLAYER_SKILL_CANCEL: 0,//player_index: 0, skill_index

		ON_BULLET_SHOT: 0,//player_index: 0, number_of_bullets: 0, bullet_id1, pos_x1, pos_y1, rot1, ...
		ON_BOUNCE_BULLET_SHOT: 0,//player_index: 0, bullet_id: 0, pos_x: 0, pos_y: 0, rot
		ON_BOMB_PLACED: 0,//player_index: 0, bomb_id: 0, pos_x: 0, pos_y
		ON_BOMB_EXPLODED: 0,//bomb_id: 0, pos_x: 0, pos_y
		ON_PLAYER_POISONED: 0,//player_index
		ON_SHIELD_EFFECT: 0,//player_index
		ON_IMMUNITY_EFFECT: 0,//player_index
		ON_SPEED_EFFECT: 0,//player_index
		ON_INSTANT_HEAL: 0,//player_index

		ON_ENERGY_BLAST: 0,//pos_x: 0, pos_y: 0, player_color_index

		COUNT_DEBUGGER: 0,
	};

	//auto numering
	var j = 0;
	for(var i in self) {
		//@ts-ignore
		self[i] = j++;
	}
	//return self;
}

if(_NetworkCodes_.self.COUNT_DEBUGGER > 255)
	console.error('More than 256 unique network codes exists!!!');

const NetworkCodes = _NetworkCodes_.self;

try {//export for NodeJS
	module.exports = _NetworkCodes_.self;
}
catch(e) {}