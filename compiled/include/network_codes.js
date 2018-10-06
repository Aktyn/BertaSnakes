"use strict";
var NetworkCodes = (function () {
    var self = {
        //TO SERVER
        SUBSCRIBE_LOBBY_REQUEST: 0,
        JOIN_ROOM_REQUEST: 0,
        LEAVE_ROOM_REQUEST: 0,
        CREATE_ROOM_REQUEST: 0,
        SEND_ROOM_MESSAGE: 0,
        SEND_PRIVATE_MESSAGE: 0,
        ADD_FRIEND_REQUEST: 0,
        REMOVE_FRIEND_REQUEST: 0,
        SIT_REQUEST: 0,
        STAND_REQUEST: 0,
        READY_REQUEST: 0,
        ACCOUNT_DATA_REQUEST: 0,
        SHIP_USE_REQUEST: 0,
        SHIP_BUY_REQUEST: 0,
        SKILL_BUY_REQUEST: 0,
        SKILL_USE_REQUEST: 0,
        SKILL_PUT_OFF_REQUEST: 0,
        SKILLS_ORDER_REQUEST: 0,
        USER_KICK_REQUEST: 0,
        //@name - room name, @map - map name, @sits_number - number, @duration - number in seconds
        ROOM_UPDATE_REQUEST: 0,
        START_GAME_CONFIRM: 0,
        //FROM SERVER
        PLAYER_ACCOUNT: 0,
        ACCOUNT_DATA: 0,
        TRANSACTION_ERROR: 0,
        ADD_FRIEND_CONFIRM: 0,
        REMOVE_FRIEND_CONFIRM: 0,
        SUBSCRIBE_LOBBY_CONFIRM: 0,
        JOIN_ROOM_CONFIRM: 0,
        CHANGE_ROOM_CONFIRM: 0,
        LEAVE_ROOM_CONFIRM: 0,
        CREATE_ROOM_CONFIRM: 0,
        ON_KICKED: 0,
        USER_JOINED_ROOM: 0,
        USER_LEFT_ROOM: 0,
        ON_ROOM_REMOVED: 0,
        ON_ROOM_CREATED: 0,
        ON_ROOM_UPDATE: 0,
        RECEIVE_CHAT_MESSAGE: 0,
        //RECEIVE_PRIVATE_MESSAGE: 0,// ----------------- // -----------------
        START_GAME_COUNTDOWN: 0,
        START_GAME: 0,
        START_GAME_FAIL: 0,
        START_ROUND_COUNTDOWN: 0,
        END_GAME: 0,
        // GAME CODES (vallue cannot be bigger then 255) //
        //SPECIAL
        START_ROUND_ACTION: 0,
        START_GAME_FAIL_ACTION: 0,
        END_GAME_ACTION: 0,
        SEND_DATA_TO_CLIENT_ACTION_FLOAT32: 0,
        //TO SERVER
        PLAYER_MOVEMENT: 0,
        PLAYER_EMOTICON: 0,
        PLAYER_SKILL_USE_REQUEST: 0,
        PLAYER_SKILL_STOP_REQUEST: 0,
        //FROM SERVER
        OBJECT_SYNCHRONIZE: 0,
        DRAW_PLAYER_LINE: 0,
        ON_PLAYER_BOUNCE: 0,
        ON_ENEMY_BOUNCE: 0,
        ON_BULLET_BOUNCE: 0,
        ON_BULLET_HIT: 0,
        //PLAYER_UPDATE: 0,//player_id, pos_x, pos_y, rot, movement_state
        PLAYER_MOVEMENT_UPDATE: 0,
        ON_PLAYER_EMOTICON: 0,
        WAVE_INFO: 0,
        SPAWN_ENEMY: 0,
        SPAWN_ITEM: 0,
        //enemy_id, player_index, pos_x, pos_y, player_rot, player_hp, player_points, bounce_x and y
        ON_PLAYER_ENEMY_COLLISION: 0,
        //ON_ENEMY_BULLET_COLLISION: 0,//enemy_id, enemy_hp, bullet_id, player_index, hit_x, hit_y
        ON_ENEMY_ATTACKED: 0,
        ON_PLAYER_ATTACKED: 0,
        ON_BULLET_EXPLODE: 0,
        //ON_SMALL_EXPLOSION: 0,//pos_x, pos_y
        ON_POISON_STAIN: 0,
        ON_PLAYER_COLLECT_ITEM: 0,
        ON_PLAYER_SPAWNING_FINISH: 0,
        //player_index, spawning_duration, death_pos_x, death_pos_y, explosion_radius
        ON_PLAYER_DEATH: 0,
        //player_index, player_x, player_y, player_hp, player_points
        ON_PLAYER_ENEMY_PAINTER_COLLISION: 0,
        ON_PLAYER_SKILL_USE: 0,
        ON_PLAYER_SKILL_CANCEL: 0,
        ON_BULLET_SHOT: 0,
        ON_BOUNCE_BULLET_SHOT: 0,
        ON_BOMB_PLACED: 0,
        ON_BOMB_EXPLODED: 0,
        ON_PLAYER_POISONED: 0,
        ON_SHIELD_EFFECT: 0,
        ON_IMMUNITY_EFFECT: 0,
        ON_SPEED_EFFECT: 0,
        ON_INSTANT_HEAL: 0,
        ON_ENERGY_BLAST: 0,
    };
    //auto numering
    var j = 0;
    for (var i in self)
        self[i] = j++;
    if (j > 256)
        console.error('More than 256 unique network codes exists!!!');
    return self;
})();
try { //export for NodeJS
    module.exports = NetworkCodes;
}
catch (e) { }
