//const NetworkCodes = (function() {
interface NetworkPackage {
	type: NetworkCodes;
	[index: string]: any;
}

enum NetworkCodes {
	//TO SERVER
	SUBSCRIBE_LOBBY_REQUEST,
	JOIN_ROOM_REQUEST,//@id - 'number' (target room id)
	LEAVE_ROOM_REQUEST,//@id - 'number' (current room id)
	CREATE_ROOM_REQUEST,
	SEND_ROOM_MESSAGE,//@msg - 'string'
	SEND_PRIVATE_MESSAGE,//@msg - 'string', @user_id - 'number'
	ADD_FRIEND_REQUEST,//@user_id - 'number'
	REMOVE_FRIEND_REQUEST,// ----- // -----
	SIT_REQUEST,
	STAND_REQUEST,
	READY_REQUEST,
	ACCOUNT_DATA_REQUEST,
	SHIP_USE_REQUEST,//@ship_type - 'number'
	SHIP_BUY_REQUEST,// ------- // -------
	SKILL_BUY_REQUEST,//@skill_id - 'number'
	SKILL_USE_REQUEST,// ------- // -------
	SKILL_PUT_OFF_REQUEST,// ------- // -------
	SKILLS_ORDER_REQUEST,//@skills - array of skill indexes and nulls
	USER_KICK_REQUEST,//@user_id - 'number'

	//@name - room name, @map - map name, @sits_number - number, @duration - number in seconds
	ROOM_UPDATE_REQUEST,
	START_GAME_CONFIRM,

	//FROM SERVER
	PLAYER_ACCOUNT,//gives user info to client (stored in @user_info property) (+ custom_data)
	ACCOUNT_DATA,//complete user's custom_data + friends as an array
	TRANSACTION_ERROR,//goes with error_detail (string)
	ADD_FRIEND_CONFIRM,//goes with user_id
	REMOVE_FRIEND_CONFIRM,// ----- // -----
	SUBSCRIBE_LOBBY_CONFIRM,//goes with array of JSON RoomInfo's in @rooms property
	
	JOIN_ROOM_CONFIRM,//goes with room users data (@users) and up to date room info (@room_info)
	CHANGE_ROOM_CONFIRM,//@old_room_id - number, @room_info - json format room info, @users...
	LEAVE_ROOM_CONFIRM,
	CREATE_ROOM_CONFIRM,

	ON_KICKED,

	USER_JOINED_ROOM,//@user_info - JSON format of UserInfo
	USER_LEFT_ROOM,//@user_id - number, @room_info - JSON format of RoomInfo

	ON_ROOM_REMOVED,//@room_id - 'number' (removed room id)
	ON_ROOM_CREATED,//@room_info - JSON data of RoomInfo instance
	ON_ROOM_UPDATE,//@room_info - JSON data of RoomInfo instance

	RECEIVE_CHAT_MESSAGE,//@from - user nickname, @public - boolean, @msg - string message
	//RECEIVE_PRIVATE_MESSAGE,// ----------------- // -----------------

	START_GAME_COUNTDOWN,//@game_duration - duration in seconds
	START_GAME,//after countdown finish
	START_GAME_FAIL,//@room_info - JSON data of RoomInfo instance
	START_ROUND_COUNTDOWN,//sends by server after every player confirms game loaded

	END_GAME,

	// GAME CODES (vallue cannot be bigger then 255) //

	//SPECIAL
	START_ROUND_ACTION,
	START_GAME_FAIL_ACTION,
	END_GAME_ACTION,//goes with 'result'
	SEND_DATA_TO_CLIENT_ACTION_FLOAT32,

	//TO SERVER
	PLAYER_MOVEMENT,//comes with player movement state
	PLAYER_EMOTICON,//comes with emoticon index
	PLAYER_SKILL_USE_REQUEST,//comes with skill index
	PLAYER_SKILL_STOP_REQUEST,// -------- // --------

	//FROM SERVER
	OBJECT_SYNCHRONIZE,//object_id, sync_array_index, pos_x, pos_y, rot
	DRAW_PLAYER_LINE,//player_index, pos_x, pos_y, player painter pos x and y
	ON_PLAYER_BOUNCE,//player_index, pos_x, pos_y, rot, collision_x, collision_y
	ON_ENEMY_BOUNCE,//enemy_id, pos_x, pos_y, rot, collision_x, collision_y
	ON_BULLET_BOUNCE,//bullet_id -------------------- // --------------------
	ON_BULLET_HIT,//bullet_id, hit_x, hit_y
	//PLAYER_UPDATE,//player_id, pos_x, pos_y, rot, movement_state
	PLAYER_MOVEMENT_UPDATE,//player_index, player_rot, movement state, player_speed
	ON_PLAYER_EMOTICON,//player_index, emoticon_id
	WAVE_INFO,//wave_number
	SPAWN_ENEMY,//enemy_class_index, object_id, pos_x, pos_y, rot
	SPAWN_ITEM,//item_id, item_type, item_x, item_y
	//enemy_id, player_index, pos_x, pos_y, player_rot, player_hp, player_points, bounce_x and y
	ON_PLAYER_ENEMY_COLLISION,
	//ON_ENEMY_BULLET_COLLISION,//enemy_id, enemy_hp, bullet_id, player_index, hit_x, hit_y

	ON_ENEMY_ATTACKED,//enemy_id, damage, player_index, new_enemy_hp, hit_x, hit_y
	ON_PLAYER_ATTACKED,//attacker_index, damage, victim_index, new_victim_hp, hit_x, hit_y

	ON_BULLET_EXPLODE,//bullet_id, hit_x, hit_y
	//ON_SMALL_EXPLOSION,//pos_x, pos_y

	ON_POISON_STAIN,//stain_index, pos_x, pos_y, size

	ON_PLAYER_COLLECT_ITEM,//item_id, item_type, player_index
	ON_PLAYER_SPAWNING_FINISH,//player_index, pos_x, pos_y
	//player_index, spawning_duration, death_pos_x, death_pos_y, explosion_radius
	ON_PLAYER_DEATH,
	//player_index, player_x, player_y, player_hp, player_points
	ON_PLAYER_ENEMY_PAINTER_COLLISION,

	ON_PLAYER_SKILL_USE,//player_index, skill_index, player_energy
	ON_PLAYER_SKILL_CANCEL,//player_index, skill_index

	ON_BULLET_SHOT,//player_index, number_of_bullets, bullet_id1, pos_x1, pos_y1, rot1, ...
	ON_BOUNCE_BULLET_SHOT,//player_index, bullet_id, pos_x, pos_y, rot
	ON_BOMB_PLACED,//player_index, bomb_id, pos_x, pos_y
	ON_BOMB_EXPLODED,//bomb_id, pos_x, pos_y
	ON_PLAYER_POISONED,//player_index
	ON_SHIELD_EFFECT,//player_index
	ON_IMMUNITY_EFFECT,//player_index
	ON_SPEED_EFFECT,//player_index
	ON_INSTANT_HEAL,//player_index

	ON_ENERGY_BLAST,//pos_x, pos_y, player_color_index

	COUNT_DEBUGGER,
}


	//auto numering
// 	var j = 0;
// 	for(var i in self)
// 		self[i] = j++;
// 	if(j > 256)
// 		console.error('More than 256 unique network codes exists!!!');
// 	return self;
// })();

if(NetworkCodes.COUNT_DEBUGGER > 255)
	console.error('More than 256 unique network codes exists!!!');

try {//export for NodeJS
	module.exports = NetworkCodes;
}
catch(e) {}