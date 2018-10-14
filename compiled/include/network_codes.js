"use strict";
var NetworkCodes;
(function (NetworkCodes) {
    //TO SERVER
    NetworkCodes[NetworkCodes["SUBSCRIBE_LOBBY_REQUEST"] = 0] = "SUBSCRIBE_LOBBY_REQUEST";
    NetworkCodes[NetworkCodes["JOIN_ROOM_REQUEST"] = 1] = "JOIN_ROOM_REQUEST";
    NetworkCodes[NetworkCodes["LEAVE_ROOM_REQUEST"] = 2] = "LEAVE_ROOM_REQUEST";
    NetworkCodes[NetworkCodes["CREATE_ROOM_REQUEST"] = 3] = "CREATE_ROOM_REQUEST";
    NetworkCodes[NetworkCodes["SEND_ROOM_MESSAGE"] = 4] = "SEND_ROOM_MESSAGE";
    NetworkCodes[NetworkCodes["SEND_PRIVATE_MESSAGE"] = 5] = "SEND_PRIVATE_MESSAGE";
    NetworkCodes[NetworkCodes["ADD_FRIEND_REQUEST"] = 6] = "ADD_FRIEND_REQUEST";
    NetworkCodes[NetworkCodes["REMOVE_FRIEND_REQUEST"] = 7] = "REMOVE_FRIEND_REQUEST";
    NetworkCodes[NetworkCodes["SIT_REQUEST"] = 8] = "SIT_REQUEST";
    NetworkCodes[NetworkCodes["STAND_REQUEST"] = 9] = "STAND_REQUEST";
    NetworkCodes[NetworkCodes["READY_REQUEST"] = 10] = "READY_REQUEST";
    NetworkCodes[NetworkCodes["ACCOUNT_DATA_REQUEST"] = 11] = "ACCOUNT_DATA_REQUEST";
    NetworkCodes[NetworkCodes["SHIP_USE_REQUEST"] = 12] = "SHIP_USE_REQUEST";
    NetworkCodes[NetworkCodes["SHIP_BUY_REQUEST"] = 13] = "SHIP_BUY_REQUEST";
    NetworkCodes[NetworkCodes["SKILL_BUY_REQUEST"] = 14] = "SKILL_BUY_REQUEST";
    NetworkCodes[NetworkCodes["SKILL_USE_REQUEST"] = 15] = "SKILL_USE_REQUEST";
    NetworkCodes[NetworkCodes["SKILL_PUT_OFF_REQUEST"] = 16] = "SKILL_PUT_OFF_REQUEST";
    NetworkCodes[NetworkCodes["SKILLS_ORDER_REQUEST"] = 17] = "SKILLS_ORDER_REQUEST";
    NetworkCodes[NetworkCodes["USER_KICK_REQUEST"] = 18] = "USER_KICK_REQUEST";
    //@name - room name, @map - map name, @sits_number - number, @duration - number in seconds
    NetworkCodes[NetworkCodes["ROOM_UPDATE_REQUEST"] = 19] = "ROOM_UPDATE_REQUEST";
    NetworkCodes[NetworkCodes["START_GAME_CONFIRM"] = 20] = "START_GAME_CONFIRM";
    //FROM SERVER
    NetworkCodes[NetworkCodes["PLAYER_ACCOUNT"] = 21] = "PLAYER_ACCOUNT";
    NetworkCodes[NetworkCodes["ACCOUNT_DATA"] = 22] = "ACCOUNT_DATA";
    NetworkCodes[NetworkCodes["TRANSACTION_ERROR"] = 23] = "TRANSACTION_ERROR";
    NetworkCodes[NetworkCodes["ADD_FRIEND_CONFIRM"] = 24] = "ADD_FRIEND_CONFIRM";
    NetworkCodes[NetworkCodes["REMOVE_FRIEND_CONFIRM"] = 25] = "REMOVE_FRIEND_CONFIRM";
    NetworkCodes[NetworkCodes["SUBSCRIBE_LOBBY_CONFIRM"] = 26] = "SUBSCRIBE_LOBBY_CONFIRM";
    NetworkCodes[NetworkCodes["JOIN_ROOM_CONFIRM"] = 27] = "JOIN_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["CHANGE_ROOM_CONFIRM"] = 28] = "CHANGE_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["LEAVE_ROOM_CONFIRM"] = 29] = "LEAVE_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["CREATE_ROOM_CONFIRM"] = 30] = "CREATE_ROOM_CONFIRM";
    NetworkCodes[NetworkCodes["ON_KICKED"] = 31] = "ON_KICKED";
    NetworkCodes[NetworkCodes["USER_JOINED_ROOM"] = 32] = "USER_JOINED_ROOM";
    NetworkCodes[NetworkCodes["USER_LEFT_ROOM"] = 33] = "USER_LEFT_ROOM";
    NetworkCodes[NetworkCodes["ON_ROOM_REMOVED"] = 34] = "ON_ROOM_REMOVED";
    NetworkCodes[NetworkCodes["ON_ROOM_CREATED"] = 35] = "ON_ROOM_CREATED";
    NetworkCodes[NetworkCodes["ON_ROOM_UPDATE"] = 36] = "ON_ROOM_UPDATE";
    NetworkCodes[NetworkCodes["RECEIVE_CHAT_MESSAGE"] = 37] = "RECEIVE_CHAT_MESSAGE";
    //RECEIVE_PRIVATE_MESSAGE,// ----------------- // -----------------
    NetworkCodes[NetworkCodes["START_GAME_COUNTDOWN"] = 38] = "START_GAME_COUNTDOWN";
    NetworkCodes[NetworkCodes["START_GAME"] = 39] = "START_GAME";
    NetworkCodes[NetworkCodes["START_GAME_FAIL"] = 40] = "START_GAME_FAIL";
    NetworkCodes[NetworkCodes["START_ROUND_COUNTDOWN"] = 41] = "START_ROUND_COUNTDOWN";
    NetworkCodes[NetworkCodes["END_GAME"] = 42] = "END_GAME";
    // GAME CODES (vallue cannot be bigger then 255) //
    //SPECIAL
    NetworkCodes[NetworkCodes["START_ROUND_ACTION"] = 43] = "START_ROUND_ACTION";
    NetworkCodes[NetworkCodes["START_GAME_FAIL_ACTION"] = 44] = "START_GAME_FAIL_ACTION";
    NetworkCodes[NetworkCodes["END_GAME_ACTION"] = 45] = "END_GAME_ACTION";
    NetworkCodes[NetworkCodes["SEND_DATA_TO_CLIENT_ACTION_FLOAT32"] = 46] = "SEND_DATA_TO_CLIENT_ACTION_FLOAT32";
    //TO SERVER
    NetworkCodes[NetworkCodes["PLAYER_MOVEMENT"] = 47] = "PLAYER_MOVEMENT";
    NetworkCodes[NetworkCodes["PLAYER_EMOTICON"] = 48] = "PLAYER_EMOTICON";
    NetworkCodes[NetworkCodes["PLAYER_SKILL_USE_REQUEST"] = 49] = "PLAYER_SKILL_USE_REQUEST";
    NetworkCodes[NetworkCodes["PLAYER_SKILL_STOP_REQUEST"] = 50] = "PLAYER_SKILL_STOP_REQUEST";
    //FROM SERVER
    NetworkCodes[NetworkCodes["OBJECT_SYNCHRONIZE"] = 51] = "OBJECT_SYNCHRONIZE";
    NetworkCodes[NetworkCodes["DRAW_PLAYER_LINE"] = 52] = "DRAW_PLAYER_LINE";
    NetworkCodes[NetworkCodes["ON_PLAYER_BOUNCE"] = 53] = "ON_PLAYER_BOUNCE";
    NetworkCodes[NetworkCodes["ON_ENEMY_BOUNCE"] = 54] = "ON_ENEMY_BOUNCE";
    NetworkCodes[NetworkCodes["ON_BULLET_BOUNCE"] = 55] = "ON_BULLET_BOUNCE";
    NetworkCodes[NetworkCodes["ON_BULLET_HIT"] = 56] = "ON_BULLET_HIT";
    //PLAYER_UPDATE,//player_id, pos_x, pos_y, rot, movement_state
    NetworkCodes[NetworkCodes["PLAYER_MOVEMENT_UPDATE"] = 57] = "PLAYER_MOVEMENT_UPDATE";
    NetworkCodes[NetworkCodes["ON_PLAYER_EMOTICON"] = 58] = "ON_PLAYER_EMOTICON";
    NetworkCodes[NetworkCodes["WAVE_INFO"] = 59] = "WAVE_INFO";
    NetworkCodes[NetworkCodes["SPAWN_ENEMY"] = 60] = "SPAWN_ENEMY";
    NetworkCodes[NetworkCodes["SPAWN_ITEM"] = 61] = "SPAWN_ITEM";
    //enemy_id, player_index, pos_x, pos_y, player_rot, player_hp, player_points, bounce_x and y
    NetworkCodes[NetworkCodes["ON_PLAYER_ENEMY_COLLISION"] = 62] = "ON_PLAYER_ENEMY_COLLISION";
    //ON_ENEMY_BULLET_COLLISION,//enemy_id, enemy_hp, bullet_id, player_index, hit_x, hit_y
    NetworkCodes[NetworkCodes["ON_ENEMY_ATTACKED"] = 63] = "ON_ENEMY_ATTACKED";
    NetworkCodes[NetworkCodes["ON_PLAYER_ATTACKED"] = 64] = "ON_PLAYER_ATTACKED";
    NetworkCodes[NetworkCodes["ON_BULLET_EXPLODE"] = 65] = "ON_BULLET_EXPLODE";
    //ON_SMALL_EXPLOSION,//pos_x, pos_y
    NetworkCodes[NetworkCodes["ON_POISON_STAIN"] = 66] = "ON_POISON_STAIN";
    NetworkCodes[NetworkCodes["ON_PLAYER_COLLECT_ITEM"] = 67] = "ON_PLAYER_COLLECT_ITEM";
    NetworkCodes[NetworkCodes["ON_PLAYER_SPAWNING_FINISH"] = 68] = "ON_PLAYER_SPAWNING_FINISH";
    //player_index, spawning_duration, death_pos_x, death_pos_y, explosion_radius
    NetworkCodes[NetworkCodes["ON_PLAYER_DEATH"] = 69] = "ON_PLAYER_DEATH";
    //player_index, player_x, player_y, player_hp, player_points
    NetworkCodes[NetworkCodes["ON_PLAYER_ENEMY_PAINTER_COLLISION"] = 70] = "ON_PLAYER_ENEMY_PAINTER_COLLISION";
    NetworkCodes[NetworkCodes["ON_PLAYER_SKILL_USE"] = 71] = "ON_PLAYER_SKILL_USE";
    NetworkCodes[NetworkCodes["ON_PLAYER_SKILL_CANCEL"] = 72] = "ON_PLAYER_SKILL_CANCEL";
    NetworkCodes[NetworkCodes["ON_BULLET_SHOT"] = 73] = "ON_BULLET_SHOT";
    NetworkCodes[NetworkCodes["ON_BOUNCE_BULLET_SHOT"] = 74] = "ON_BOUNCE_BULLET_SHOT";
    NetworkCodes[NetworkCodes["ON_BOMB_PLACED"] = 75] = "ON_BOMB_PLACED";
    NetworkCodes[NetworkCodes["ON_BOMB_EXPLODED"] = 76] = "ON_BOMB_EXPLODED";
    NetworkCodes[NetworkCodes["ON_PLAYER_POISONED"] = 77] = "ON_PLAYER_POISONED";
    NetworkCodes[NetworkCodes["ON_SHIELD_EFFECT"] = 78] = "ON_SHIELD_EFFECT";
    NetworkCodes[NetworkCodes["ON_IMMUNITY_EFFECT"] = 79] = "ON_IMMUNITY_EFFECT";
    NetworkCodes[NetworkCodes["ON_SPEED_EFFECT"] = 80] = "ON_SPEED_EFFECT";
    NetworkCodes[NetworkCodes["ON_INSTANT_HEAL"] = 81] = "ON_INSTANT_HEAL";
    NetworkCodes[NetworkCodes["ON_ENERGY_BLAST"] = 82] = "ON_ENERGY_BLAST";
    NetworkCodes[NetworkCodes["COUNT_DEBUGGER"] = 83] = "COUNT_DEBUGGER";
})(NetworkCodes || (NetworkCodes = {}));
//auto numering
// 	var j = 0;
// 	for(var i in self)
// 		self[i] = j++;
// 	if(j > 256)
// 		console.error('More than 256 unique network codes exists!!!');
// 	return self;
// })();
if (NetworkCodes.COUNT_DEBUGGER > 255)
    console.error('More than 256 unique network codes exists!!!');
try { //export for NodeJS
    module.exports = NetworkCodes;
}
catch (e) { }
