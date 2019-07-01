export interface NetworkPackage {
	type: NetworkCodes;
	[index: string]: any;
}

const enum NetworkCodes {
	//TO SERVER
	LOGIN = 0,//token: string
	ACCOUNT_DATA_REQUEST,//token: string
	CREATE_ROOM_REQUEST,
	ROOM_LIST_REQUEST,
	JOIN_ROOM_REQUEST,//id: number (target room id)
	LEAVE_ROOM_REQUEST,//leave current room
	//name: string, map: string, gamemode: number, sits_number: number, duration: number
	ROOM_SETTINGS_UPDATE_REQUEST,
	USER_KICK_REQUEST,//user_id: number
	SIT_REQUEST,
	STAND_REQUEST,
	READY_REQUEST,
	SEND_ROOM_CHAT_MESSAGE,//msg: string
	START_GAME_CONFIRMATION,

	//FROM SERVER
	ON_USER_DATA,//user: UserCustomData
	ON_ROOM_JOINED,//room: RoomCustomData, users: UserPublicData[]
	ON_ROOM_LEFT,//room_id: number
	ON_ROOM_CREATED,//room: RoomCustomData
	ON_ROOM_DATA_UPDATE,//room: RoomCustomData
	ON_ENTIRE_LIST_ROOMS_DATA,//rooms: RoomCustomData[]
	ON_ROOM_REMOVED,//room_id: number

	ON_USER_LEFT_ROOM,//user_id: number, room_id: number
	ON_USER_JOINED_ROOM,//user: UserPublicData, room_id: number
	ON_KICKED_FROM_ROOM,//room_name: string
	ACCOUNT_ALREADY_LOGGED_IN,
	ON_ROOM_MESSAGE,//room_id: number, author_id: number, timestamp: number, content: string
	GAME_COUNTDOWN_UPDATE,//room_id: number, time: number | null

	ON_GAME_START,//room_id: number
	ON_GAME_FAILED_TO_START,//room: RoomCustomData

	// GAME CODES //

	//SPECIAL
	START_ROUND_ACTION,
	START_GAME_FAIL_ACTION,
	END_GAME_ACTION,//goes with 'result'
	START_ROUND_COUNTDOWN,//sends by server after every player confirms game loaded
	END_GAME,
	SEND_DATA_TO_CLIENT_ACTION_FLOAT32,

	//CODES SEND IN ARRAY BUFFER
	ON_PLAYER_BOUNCE,//player_index: 0, pos_x: 0, pos_y: 0, rot: 0, collision_x: 0, collision_y
	ON_ENEMY_BOUNCE,//enemy_id: 0, pos_x: 0, pos_y: 0, rot: 0, collision_x: 0, collision_y
	ON_BULLET_BOUNCE,//bullet_id -------------------- // --------------------
	ON_PLAYER_SPAWNING_FINISH,//player_index: 0, pos_x: 0, pos_y

	ON_BULLET_SHOT,//player_index: 0, number_of_bullets: 0, bullet_id1, pos_x1, pos_y1, rot1, ...
	ON_BOUNCE_BULLET_SHOT,//player_index: 0, bullet_id: 0, pos_x: 0, pos_y: 0, rot
	ON_BOMB_PLACED,//player_index: 0, bomb_id: 0, pos_x: 0, pos_y
	ON_BOMB_EXPLODED,//bomb_id: 0, pos_x: 0, pos_y
	ON_PLAYER_POISONED,//player_index
	ON_SHIELD_EFFECT,//player_index
	ON_IMMUNITY_EFFECT,//player_index
	ON_SPEED_EFFECT,//player_index
	ON_INSTANT_HEAL,//player_index
	ON_ENERGY_BLAST,//pos_x: 0, pos_y: 0, player_color_index

	ON_ENEMY_ATTACKED,//enemy_id: 0, damage: 0, player_index: 0, new_enemy_hp: 0, hit_x: 0, hit_y
	ON_PLAYER_ATTACKED,//attacker_index: 0, damage: 0, victim_index: 0, new_victim_hp: 0, hit_x: 0, hit_y

	ON_BULLET_EXPLODE,//bullet_id: 0, hit_x: 0, hit_y

	ON_BULLET_HIT,//bullet_id: 0, hit_x: 0, hit_y
	//PLAYER_UPDATE,//player_id: 0, pos_x: 0, pos_y: 0, rot: 0, movement_state
	PLAYER_MOVEMENT_UPDATE,//player_index: 0, player_rot: 0, movement state: 0, player_speed
	ON_PLAYER_EMOTICON,//player_index: 0, emoticon_id
	WAVE_INFO,//wave_number
	SPAWN_ENEMY,//enemy_class_index: 0, object_id: 0, pos_x: 0, pos_y: 0, rot
	SPAWN_ITEM,//item_id: 0, item_type: 0, item_x: 0, item_y
	//enemy_id: 0, player_index: 0, pos_x: 0, pos_y: 0, player_rot: 0, player_hp: 0, player_points: 0, 
	//bounce_x and y
	ON_PLAYER_ENEMY_COLLISION,

	ON_POISON_STAIN,//stain_index: 0, pos_x: 0, pos_y: 0, size

	ON_PLAYER_COLLECT_ITEM,//item_id: 0, item_type: 0, player_index
	
	//player_index: 0, spawning_duration: 0, death_pos_x: 0, death_pos_y: 0, explosion_radius
	ON_PLAYER_DEATH,
	//player_index: 0, player_x: 0, player_y: 0, player_hp: 0, player_points
	ON_PLAYER_ENEMY_PAINTER_COLLISION,

	ON_PLAYER_SKILL_USE,//player_index: 0, skill_index: 0, player_energy
	ON_PLAYER_SKILL_CANCEL,//player_index: 0, skill_index

	OBJECT_SYNCHRONIZE,//object_id: 0, sync_array_index: 0, pos_x: 0, pos_y: 0, rot
	DRAW_PLAYER_LINE,//player_index: 0, pos_x: 0, pos_y: 0, player painter pos x and y

	//to server
	PLAYER_MOVEMENT,//comes with player movement state
	PLAYER_EMOTICON,//comes with emoticon index
	PLAYER_SKILL_USE_REQUEST,//comes with skill index
	PLAYER_SKILL_STOP_REQUEST,// -------- // --------

	//BELOW CODES ARE BEFORE 2019

	/*SUBSCRIBE_LOBBY_REQUEST,
	
	SEND_PRIVATE_MESSAGE,//@msg - 'string', @user_id - 'number'
	ADD_FRIEND_REQUEST,//@user_id - 'number'
	REMOVE_FRIEND_REQUEST,// ----- // -----
	
	SHIP_USE_REQUEST,//@ship_type - 'number'
	SHIP_BUY_REQUEST,// ------- // -------
	SKILL_BUY_REQUEST,//@skill_id - 'number'
	SKILL_USE_REQUEST,// ------- // -------
	SKILL_PUT_OFF_REQUEST,// ------- // -------
	SKILLS_ORDER_REQUEST,//@skills - array of skill indexes and nulls
	
	TRANSACTION_ERROR,//goes with error_detail (string)
	ADD_FRIEND_CONFIRM,//goes with user_id
	REMOVE_FRIEND_CONFIRM,// ----- // -----
	SUBSCRIBE_LOBBY_CONFIRM,//goes with array of JSON RoomInfo's in @rooms property

	RECEIVE_CHAT_MESSAGE,//@from - user nickname: 0, @public - boolean: 0, @msg - string message
	//RECEIVE_PRIVATE_MESSAGE,// ----------------- // -----------------

	// GAME CODES (value cannot be bigger then 255) //

	//ON_ENEMY_BULLET_COLLISION,//enemy_id: 0, enemy_hp: 0, bullet_id: 0, player_index: 0, 
	//hit_x: 0, hit_y: 0

	
	//ON_SMALL_EXPLOSION,//pos_x: 0, pos_y

	
	*/
	CODES_COUNT,
}

//TODO - separate enumerator for sending byte buffers

if(NetworkCodes.CODES_COUNT > 255)
	console.error('More than 256 unique network codes exists!!!');

export default NetworkCodes;