import {GAME_MODES} from './room_info';
import {map_name} from './game/maps';

const SERVER_PORT = 5348;

export interface CoinPackSchema {
	coins: number;
	price: number;//USD
}

export const enum RANKING_TYPES {
	TOP_RANK = 0,
	HIGHEST_LEVEL,
	NEW_ACCOUNTS,
}

export default {
	api_server_url: process.env.NODE_ENV === 'development' ? 
		`http://localhost:${SERVER_PORT}` : 
		//@ts-ignore
		typeof location !== 'undefined' ? location.origin : undefined,

	SERVER_PORT,
	WEBSOCKET_PORT: 2674,
	SOCIAL_WEBSOCKET_PORT: 2675,
	
	BACKUPS_INTERVAL: 1000*60*60*12,//every twelve hours
	MAXIMUM_BACKUPS: 5,
	
	PAGE_TITLE: 'BertaSnakes',
	
	MAXIMUM_SIMULTANEOUSLY_GAMES: 10,//because each games takes some processing power and every machine has it's limit
	
	TOKEN_LIFETIME: 1000 * 60 * 60 * 24 * 7, //one week
	MAX_LOGIN_LENGTH: 64,
	MIN_LOGIN_LENGTH: 3,
	MAX_PASSWORD_LENGTH: 64,
	MIN_PASSWORD_LENGTH: 6,

	MAXIMUM_IMAGE_FILE_SIZE: 1024*1024*2,//2MB
	//server will scale uploaded avatar to this resolution before saving it as file
	CONVERTED_AVATARS_RESOLUTION: 128,

	START_GAME_COUNTDOWN: 3,//seconds
	ROUND_START_DELAY: 4,//seconds

	//room settings
	MINIMUM_GAME_DURATION: 60,//seconds
	DEFAULT_GAME_DURATION: 60 * 5,
	MAXIMUM_GAME_DURATION: 1800,//seconds
	DEFAULT_MAX_ENEMIES: 100,
	MAXIMUM_ENEMIES_LIMIT: 200,
	MAXIMUM_ROOM_NAME_LENGTH: 64,
	DEFAULT_GAME_MODE: GAME_MODES.COOPERATION,
	DEFAULT_SITS: 1,
	MAXIMUM_SITS: 8,
	DEFAULT_MAP: 'Simple Maze' as map_name,
	MAXIMUM_MESSAGE_LENGTH: 2048,

	//user settings
	INITIAL_RANK: 1000,
	SKILLS_SLOTS: 6,
	MAXIMUM_NUMBER_OF_FRIENDS: 128,
	MAX_LEVEL: 99,
	
	//lists settings
	ITEMS_PER_GAMES_LIST_PAGE: 10,
	ITEMS_PER_RANKING_PAGE: 16,
	MAXIMUM_LENGTH_OF_MESSAGES_CHUNK: 128,
	
	COIN_PACKS: {
		small:  <CoinPackSchema>{   coins: 5000,   price: 3},
		medium: <CoinPackSchema>{   coins: 30000,  price: 15},
		large:  <CoinPackSchema>{   coins: 70000,  price: 30}
	}
}