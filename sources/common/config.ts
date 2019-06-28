const SERVER_PORT = 5348;

import {GAME_MODES} from './room_info';

export default {
	api_server_url: process.env.NODE_ENV === 'development' ? 
		`http://localhost:${SERVER_PORT}` : 
		//@ts-ignore
		typeof location !== 'undefined' ? location.origin : undefined,

	SERVER_PORT,
	WEBSOCKET_PORT: 2674,
	
	TOKEN_LIFETIME: 1000 * 60 * 60 * 24 * 7, //one week
	MAX_LOGIN_LENGTH: 64,
	MAX_PASSWORD_LENGTH: 64,

	MAXIMUM_IMAGE_FILE_SIZE: 1024*1024*2,//2MB
	//server will scale uploaded avatar to this resolution before saving it as file
	CONVERTED_AVATARS_RESOLUTION: 128,

	START_GAME_COUNTDOWN: 3,//seconds
	ROUND_START_DELAY: 4,//seconds

	//room settings
	MINIMUM_GAME_DURATION: 60,//seconds
	DEFAULT_GAME_DURATION: 60 * 2,
	MAXIMUM_GAME_DURATION: 1800,//seconds
	MAXIMUM_ROOM_NAME_LENGTH: 64,
	DEFAULT_GAME_MODE: GAME_MODES.COOPERATION,
	DEFAULT_SITS: 1,
	MAXIMUM_SITS: 8,
	DEFAULT_MAP: 'Simple Maze',
	MAXIMUM_MESSAGE_LENGTH: 2048,

	//user settings
	INITIAL_RANK: 1000,
	SKILLS_SLOTS: 6,
	
	//lists settings
	ITEMS_PER_GAMES_LIST_PAGE: 10
}