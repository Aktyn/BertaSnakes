import {Db, MongoClient, ObjectId} from 'mongodb';
import {getArgument} from '../utils';
import Config from '../../common/config';

import {GAME_MODES, RoomCustomData} from '../../common/room_info';
import {PlayerResultJSON} from '../../common/game/game_result';
import {PLAYER_TYPES} from "../../common/game/objects/player";

//queries
import Sessions from './queries/sessions';
import Accounts from './queries/accounts';
import Rankings from './queries/rankings';
import Games from './queries/games';
import Social from './queries/social';
import Statistics from './queries/statistics';
import {setTotalAccounts} from "./cached";

import cleanUpAll from './cleanups';

const uri = 'mongodb://localhost:27017';
const DB_NAME = 'BertaSnakes';

const mongodb_user = getArgument('MONGO_USER');
const mongodb_pass = getArgument('MONGO_PASS');

let client: MongoClient;
let db: Db;
function assert_connection() {
	if(!client) throw new Error('Database connection not ready');
}

let connection_listeners: (() => void)[] = [];

export const enum COLLECTIONS {
	accounts = 'accounts',//username, password, email, verification_code, creation_time, last_login, ...
	sessions = 'sessions',//account_id, token, expiration
	games = 'games',//finish_timestamp, name, map, gamemode, duration, results
	friendships = 'friendships',
	social_messages = 'social_messages',
	user_agents = 'user_agents',
	visits = 'visits'
}

export function getCollection(name: string) {
	assert_connection();
	return (db || (db = client.db(DB_NAME))).collection(name);
}

MongoClient.connect(uri, {
	useNewUrlParser: true, 
	auth: {
		user: mongodb_user, 
		password: mongodb_pass
	}
}).then(async (_client) => {
	db = _client.db(DB_NAME);
	client = _client;
	console.log('Database connection established');

	connection_listeners.forEach(c => c());
	connection_listeners = [];

	// INDEXES //
	
	//accounts
	await db.collection(COLLECTIONS.accounts).createIndex({username: 'hashed'}, 
		{name: 'username_index'});//NOTE - hashed index cannot be unique at the moment
	await db.collection(COLLECTIONS.accounts).createIndex({email: 'hashed'}, 
		{name: 'email_index'});
	await db.collection(COLLECTIONS.accounts).createIndex({rank: -1},
		{name: 'rank_sorting'});
	await db.collection(COLLECTIONS.accounts).createIndex({creation_time: -1},
		{name: 'creation_date_sorting'});
	await db.collection(COLLECTIONS.accounts).createIndex({level: -1, exp: -1},
		{name: 'level sorting'});

	//sessions
	await db.collection(COLLECTIONS.sessions).createIndex({account_id: 1}, 
		{name: 'account_session', unique: true});
	await db.collection(COLLECTIONS.sessions).createIndex({token: 'hashed'}, 
		{name: 'session_token'});
	
	//games
	//await db.collection(COLLECTIONS.games).createIndex({finish_timestamp: 1},
	//	{name: 'timestamp_index'});
	
	//friends
	await db.collection(COLLECTIONS.friendships).createIndex({from: 'hashed'},
		{name: 'from-friend-search'});
	await db.collection(COLLECTIONS.friendships).createIndex({to: 'hashed'},
		{name: 'to-friend-search'});
	
	//social messages
	await db.collection(COLLECTIONS.social_messages).createIndex({friendship_id: 'hashed'},
		{name: 'friendship_search'});
	
	//user agents
	await db.collection(COLLECTIONS.user_agents).createIndex({agent: 'hashed'},
		{name: 'user_agent_search'});
	
	//visits
	await db.collection(COLLECTIONS.visits).createIndex({account_id: 'hashed'},
		{name: 'filter_by_account'});
	
	await cleanUpAll();
	
	//some precalculations
	setTotalAccounts( await db.collection(COLLECTIONS.accounts).countDocuments() );
	
	//check total sizes of collections and show warning if it is getting too big
	let total_usage = 0;
	for(let collection_name of [COLLECTIONS.visits, COLLECTIONS.games, COLLECTIONS.social_messages, COLLECTIONS.accounts]) {
		let size = await db.collection(collection_name).stats().then(s => s.storageSize + s.totalIndexSize);
		total_usage += size;
		if(size/1024/1024/1024 > 1) {//more than 1 gibibyte
			console.warn('WARNING! Collection:', collection_name, 'takes',
				((size/1024/1024)|0)+'MiB', 'of a disk space');
		}
	}
	console.log('Total database size:', (total_usage/1024/1024).toFixed(2), 'MiB');
	
	//tests
	/*db.collection(COLLECTIONS.games).updateMany({}, {
		$unset: {finish_timestamp: undefined}
	}).catch(console.error);*/
}).catch(console.error);

export interface GameSchema {
	_id: string;
	duration: number;
	finish_timestamp: number;
	gamemode: GAME_MODES;
	map: string;
	name: string;
	results: PlayerResultJSON[];
}

export interface FriendSchema {
	friendship_id: string;
	friend_data: PublicAccountSchema;
	is_left: boolean;//if true - this is user from 'from' field from friendships
	online: boolean;
	room_data: RoomCustomData | null;
	is_playing: boolean;
}

export interface SocialMessage {
	id: string;
	left: boolean;
	timestamp: number;
	content: string[];//following messages from same user in same period of time can be stacked
}

export interface PublicAccountSchema {
	id: string;
	
	username: string;
	avatar: string;
	creation_time: number;
	last_login: number;
	
	level: number;
	rank: number;

	exp: number;
	
	skills: (number | null)[];//chosen skills
	ship_type: PLAYER_TYPES;
	
	total_games: number;
}

export interface AccountSchema extends PublicAccountSchema {
	email: string;
	verified: boolean;
	admin: boolean;
	
	coins: number;

	available_skills: number[];
	available_ships: PLAYER_TYPES[];
}

export function extractUserPublicData(account: any): PublicAccountSchema {
	return {
		id: (account._id as ObjectId).toHexString(),
		username: account.username || 'Noname',
		avatar: account.avatar || null,
		creation_time: account.creation_time || Date.now(),
		last_login: account.last_login || new Date(824301420000),//best birthday ever
		
		level: account.level || 1,
		rank: account.rank || Config.INITIAL_RANK,

		exp: account.exp || 0,
		
		skills: account.skills || new Array(Config.SKILLS_SLOTS).fill(null),
		ship_type: account.ship_type || 0,
		
		total_games: account.total_games || 0
	};
}

export default {
	onConnect(callback: () => void) {
		if(client)
			callback();
		else
			connection_listeners.push(callback);
	},

	disconnect() {
		assert_connection();
		client.close().catch(console.error);
	},
	
	...Sessions,
	...Accounts,
	...Rankings,
	...Games,
	...Social,
	...Statistics
}