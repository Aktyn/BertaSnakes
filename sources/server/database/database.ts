import {Db, MongoClient, ObjectId} from 'mongodb';
import {getArgument} from '../utils';
import ERROR_CODES from '../../common/error_codes';
import Config, {RANKING_TYPES} from '../../common/config';

import RoomInfo, {GAME_MODES} from '../../common/room_info';
import {PlayerResultJSON} from '../../common/game/game_result';
import {PLAYER_TYPES} from "../../common/game/objects/player";

import cleanUpAll from './cleanups';

const uri = 'mongodb://localhost:27017';
const DB_NAME = 'BertaSnakes';

export const enum COLLECTIONS {
	accounts = 'accounts',//username, password, email, verification_code, creation_time, last_login, ...
	sessions = 'sessions',//account_id, token, expiration
	games = 'games',//finish_timestamp, name, map, gamemode, duration, results
	friendships = 'friendships',
	social_messages = 'social_messages'
}
let total_accounts = 0;//cached counter

let client: MongoClient;
let db: Db;
function assert_connection() {
	if(!client) throw new Error('Database connection not ready');
}

let connection_listeners: (() => void)[] = [];

export function getCollection(name: string) {
	assert_connection();
	return (db || (db = client.db(DB_NAME))).collection(name);
}

const mongodb_user = getArgument('MONGO_USER');
const mongodb_pass = getArgument('MONGO_PASS');

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
	
	//ACCOUNTS
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

	//SESSIONS
	await db.collection(COLLECTIONS.sessions).createIndex({account_id: 1}, 
		{name: 'account_session', unique: true});
	await db.collection(COLLECTIONS.sessions).createIndex({token: 'hashed'}, 
		{name: 'session_token'});
	
	//GAMES
	await db.collection(COLLECTIONS.games).createIndex({finish_timestamp: 1},
		{name: 'timestamp_index'});
	
	//FRIENDS
	await db.collection(COLLECTIONS.friendships).createIndex({from: 'hashed'},
		{name: 'from-friend-search'});
	await db.collection(COLLECTIONS.friendships).createIndex({to: 'hashed'},
		{name: 'to-friend-search'});
	
	//SOCIAL MESSAGES
	await db.collection(COLLECTIONS.social_messages).createIndex({friendship_id: 'hashed'},
		{name: 'friendship_search'});
	await db.collection(COLLECTIONS.social_messages).createIndex({timestamp: -1},
		{name: 'message_time_sorting'});
	
	await cleanUpAll();
	
	//some precalculations
	total_accounts = await db.collection(COLLECTIONS.accounts).countDocuments();
	
	//tests
	// db.collection(COLLECTIONS.accounts).find({}).forEach(acc => {
	// 	if(acc.username === 'Aktyn')
	// 		return;
	// 	db.collection(COLLECTIONS.accounts).updateOne({_id: acc._id}, {
	// 		$set: { creation_time: Date.now() - Math.floor(Math.random()*1000*60*60*24*31) }
	// 	}).catch(console.error);
	// }).catch(console.error);
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
}

export interface SocialMessage {
	id: string;
	left: boolean;
	timestamp: number;
	content: string[];//following messages from same user in same period of time can be stacked
}

function mapFriendshipData(data: any[], is_left: boolean) {
	return data.map(friendship_data => {
		if( friendship_data['friend'].length < 1 )
			return null;
		return {
			friendship_id: (friendship_data['_id'] as ObjectId).toHexString(),
			friend_data: extractUserPublicData( friendship_data['friend'][0] ),
			is_left,
			online: false
		};
	}).filter(acc => acc !== null) as FriendSchema[];
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
	
	coins: number;

	available_skills: number[];
	available_ships: PLAYER_TYPES[];
}

function extractUserPublicData(account: any): PublicAccountSchema {
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

function extractAccountSchema(account: any): AccountSchema {
	return {
		...extractUserPublicData(account),
		
		email: account.email || '',
		verified: account.verification_code === '',
		
		coins: account.coins || 0,

		available_skills: account.available_skills || [],
		available_ships: account.available_ships || [],
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

	async addSession(_account_id: string, _token: string, _expiration_date: number) {
		try {
			let sessions = getCollection(COLLECTIONS.sessions);
			let target_id = ObjectId.createFromHexString(_account_id);

			//first - remove previous session account session if one exists
			await sessions.deleteOne({
				account_id: target_id
			});

			let res = await sessions.insertOne({
				account_id: target_id,
				token: _token,
				expiration: _expiration_date
			});

			if(!res.result.ok)
				return {error: ERROR_CODES.DATABASE_ERROR};
			
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async getSession(_token: string) {//returns account's id
		try {
			let session_data = await getCollection(COLLECTIONS.sessions).findOne({
				token: _token
			});
			if(session_data && session_data.expiration > Date.now() && 
				typeof session_data.account_id === 'object') 
			{
				return (session_data.account_id as ObjectId).toHexString();
			}
			return null;
		}
		catch(e) {
			console.error(e);
			return null;
		}
	},

	async login(_username: string, _password: string) {
		try {
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				username: new RegExp(`^${_username}$`, 'i')
			});

			if(!account)
				return {error: ERROR_CODES.USERNAME_NOT_FOUND};
			if(account.password === _password)
				return {
					error: ERROR_CODES.SUCCESS, 
					account: extractAccountSchema(account)
				};
			else
				return {error: ERROR_CODES.INCORRECT_PASSWORD};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async updateLastLoginTime(account_hex_id: string) {
		try {
			await getCollection(COLLECTIONS.accounts).updateOne({
				_id: ObjectId.createFromHexString(account_hex_id)
			}, {
				$set: { last_login: Date.now() }
			});
		} catch(e) {
			console.error(e);
		}
	},

	async updateAvatar(account_hex_id: string, _avatar: string | null) {
		try {
			let res = await getCollection(COLLECTIONS.accounts).updateOne({
				_id: ObjectId.createFromHexString(account_hex_id)
			}, {
				$set: {avatar: _avatar}
			});

			if(!res.result.ok)
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async getAccount(account_hex_id: string) {
		try {
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				_id: ObjectId.createFromHexString(account_hex_id)
			});

			if(!account)
				return null;

			return extractAccountSchema(account);
		}
		catch(e) {
			console.error(e);
			return null;
		}
	},
	
	async getUserPublicData(account_hex_id: string) {
		try {
			let user = await getCollection(COLLECTIONS.accounts).findOne({
				_id: ObjectId.createFromHexString(account_hex_id)
			});
			
			if (!user)
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS};
			
			return {error: ERROR_CODES.SUCCESS, data: extractUserPublicData(user)};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async getAccountFromToken(_token: string) {
		let session_data = await getCollection(COLLECTIONS.sessions).findOne({
			token: _token
		});
		if(!session_data || session_data.expiration <= Date.now() || typeof session_data.account_id !== 'object')
			return {error: ERROR_CODES.SESSION_EXPIRED};
		let account = await getCollection(COLLECTIONS.accounts).findOne({
			_id: session_data.account_id
		});
		if(!account)
			return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS};
		return { error: ERROR_CODES.SUCCESS, account: extractAccountSchema(account) }
	},

	async insertAccount(_nick: string, _hashed_password: string, _email: string, _verification_code: string) {
		let accounts = getCollection(COLLECTIONS.accounts);
		try {
			//checking for existing username or email
			let existing_nick = await accounts.findOne({
				username: _nick
			});
			if(existing_nick)
				return {error: ERROR_CODES.USERNAME_TAKEN};

			let existing_email = await accounts.findOne({
				email: _email
			});
			if(existing_email)
				return {error: ERROR_CODES.EMAIL_ALREADY_IN_USE};

			let insert_res = await accounts.insertOne({
				username: _nick,
				password: _hashed_password,
				email: _email,
				verification_code: _verification_code,
				creation_time: Date.now(),
				last_login: Date.now(),
				avatar: null,

				level: 1,
				rank: Config.INITIAL_RANK,

				exp: 0,
				coins: 0,

				available_skills: [],
				skills: new Array(Config.SKILLS_SLOTS).fill(null),

				available_ships: [0],
				ship_type: 0,
				
				total_games: 0
			});

			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			
			total_accounts++;
			return {error: ERROR_CODES.SUCCESS, inserted_id: insert_res.insertedId.toHexString()};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async updateAccountCustomData(account_hex_id: string, data: AccountSchema) {
		try {
			let update_res = await getCollection(COLLECTIONS.accounts).updateOne({
				_id: ObjectId.createFromHexString(account_hex_id)
			}, {
				$set: {
					level: data.level,
					rank: data.rank,
				
					exp: data.exp,
					coins: data.coins,
				
					available_skills: data.available_skills,
					skills: data.skills,//chosen skills
				
					available_ships: data.available_ships,
					ship_type: data.ship_type,
					
					total_games: data.total_games
				}
			});
			
			if( !update_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	removeAccount(_hex_id: string) {
		return getCollection(COLLECTIONS.accounts).deleteOne({
			_id: ObjectId.createFromHexString(_hex_id)
		});
	},

	async verifyAccount(session_token: string, _verification_code: string) {
		try {
			let session_account_id = await this.getSession(session_token);
			if(!session_account_id)
				return {error: ERROR_CODES.ACCOUNT_NOT_LOGGED_IN};

			const accounts = getCollection(COLLECTIONS.accounts);
			const object_id = ObjectId.createFromHexString(session_account_id);
			let account = await accounts.findOne({
				_id: object_id
			});
			if(!account)
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS};
			//console.log(account);
			if(account.verification_code !== _verification_code)
				return {error: ERROR_CODES.INCORRECT_VERIFICATION_CODE};
			
			let update_res = await accounts.updateOne({
				_id: object_id
			}, {
				$set: {verification_code: ''}
			});

			if( !update_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async getAccountVerificationCode(session_token: string) {
		try {
			let session_account_id = await this.getSession(session_token);
			if (!session_account_id)
				return {error: ERROR_CODES.ACCOUNT_NOT_LOGGED_IN};
			
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				_id: ObjectId.createFromHexString(session_account_id)
			});
			if (!account)
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS};
			return {
				error: ERROR_CODES.SUCCESS,
				code: account.verification_code as string,
				email: account.email as string
			};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async saveGameResult(room: RoomInfo, players_results: PlayerResultJSON[]) {
		try {
			let insert_res = await getCollection(COLLECTIONS.games).insertOne({
				finish_timestamp: Date.now(),
				name: room.name,
				map: room.map,
				gamemode: room.gamemode,
				duration: room.duration,
				results: players_results.map(result => {
					delete result.avatar;//it is redundant and user may change avatar after game
					delete result.user_id;//irrelevant for database
					return result;
				})
			});
			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getRankingPage(page: number, type: RANKING_TYPES) {
		try {
			let sort_query: {};
			
			switch(type) {
				default:
					return {error: ERROR_CODES.INCORRECT_RANKING_TYPE};
				case RANKING_TYPES.TOP_RANK:
					sort_query = { rank: -1 };
					break;
				case RANKING_TYPES.HIGHEST_LEVEL:
					sort_query = { level: -1, exp: -1 };
					break;
				case RANKING_TYPES.NEW_ACCOUNTS:
					sort_query = { creation_time: -1 };
					break;
			}
			
			let accounts: PublicAccountSchema[] = await getCollection(COLLECTIONS.accounts).aggregate([
				{ $sort: sort_query },
				{ $limit: (page+1)*Config.ITEMS_PER_RANKING_PAGE },
				{ $skip: page*Config.ITEMS_PER_RANKING_PAGE }
			]).toArray();
			
			accounts = accounts.map(acc => extractUserPublicData(acc));
			
			return {error: ERROR_CODES.SUCCESS, total_accounts: total_accounts, data: accounts};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getAccountGames(account_hex_id: string, page: number) {
		try {
			let games: GameSchema[] = await getCollection(COLLECTIONS.games).aggregate([
				{
					$match: {
						results: {
							$elemMatch: {
								account_id: account_hex_id
							}
						}
					}
				}, {
					$sort: {finish_timestamp: -1}
				}, {
					$project: {
						_id: 1,
						finish_timestamp: 1,
						name: 1,
						map: 1,
						gamemode: 1,
						duration: 1,
						results: 1
					}
				}, {
                    $limit: (page+1)*Config.ITEMS_PER_GAMES_LIST_PAGE
                }, {
                    $skip: page*Config.ITEMS_PER_GAMES_LIST_PAGE
                }
			]).toArray();
			
			games.forEach(g => g._id = (g._id as unknown as ObjectId).toHexString());
			
			return {error: ERROR_CODES.SUCCESS, games};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getGame(game_id: string) {
		try {
			let game = await getCollection(COLLECTIONS.games).findOne({
				_id: ObjectId.createFromHexString(game_id)
			});
			
			if (!game)
				return {error: ERROR_CODES.GAME_DOES_NOT_EXISTS};
			return {
				error: ERROR_CODES.SUCCESS,
				game: game as GameSchema
			};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	////////////////////////////////////////////////////
	
	async getFriendshipID(self_hex: string, friend_hex: string) {
		try {
			let self_id = ObjectId.createFromHexString(self_hex);
			let friend_id = ObjectId.createFromHexString(friend_hex);
			
			let found_on_left = await getCollection(COLLECTIONS.friendships).findOne({
				from: friend_id,
				to: self_id
			}, {projection: {_id: 1}});
			
			if(found_on_left) return {id: found_on_left['_id'], left: true};
			
			let found_on_right = await getCollection(COLLECTIONS.friendships).findOne({
				from: self_id,
				to: friend_id
			}, {projection: {_id: 1}});
			
			if(found_on_right) return {id: found_on_right['_id'], left: false};
			
			
			return null;
		}
		catch(e) {
			console.error(e);
			return null;
		}
	},
	
	async getAccountFriends(account_hex_id: string) {
		try {
			let account_id = ObjectId.createFromHexString(account_hex_id);
			let from_friends = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						to: account_id,
						accepted: true
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'from',
						foreignField: '_id',
						as: 'friend'
					}
				}
			]).toArray();
			let to_friends = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						from: account_id,
						accepted: true
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'to',
						foreignField: '_id',
						as: 'friend'
					}
				}
			]).toArray();
			
			let friends = mapFriendshipData(from_friends, true).concat(
				mapFriendshipData(to_friends, false)
			);
			
			return {error: ERROR_CODES.SUCCESS, friends};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getAccountFriendRequests(account_hex_id: string) {//returns those accounts who requested friendship
		try {
			let account_id = ObjectId.createFromHexString(account_hex_id);
			
			let requesting_friends = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						accepted: false,//not accepted request
						to: account_id,//to given account
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'from',
						foreignField: '_id',
						as: 'requesting_friend'
					}
				}
			]).toArray();
			
			let potential_friends = requesting_friends.map(friendship_data => {
				if( friendship_data['requesting_friend'].length < 1 )
					return null;
				return extractUserPublicData( friendship_data['requesting_friend'][0] );
			}).filter(acc => acc !== null) as PublicAccountSchema[];
			
			return {error: ERROR_CODES.SUCCESS, potential_friends};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getAccountRequestedFriends(account_hex_id: string) {//returns those friends that user send request to
		try {
			let account_id = ObjectId.createFromHexString(account_hex_id);
			
			let requested_friends_res = await getCollection(COLLECTIONS.friendships).aggregate([
				{
					$match: {
						accepted: false,//not accepted request
						from: account_id,//from given account
					}
				}, {
					$limit: Config.MAXIMUM_NUMBER_OF_FRIENDS
				}, {
					$lookup: {
						from: COLLECTIONS.accounts,
						localField: 'to',
						foreignField: '_id',
						as: 'requested_friend'
					}
				}
			]).toArray();
			
			let requested_friends = requested_friends_res.map(friendship_data => {
				if( friendship_data['requested_friend'].length < 1 )
					return null;
				return extractUserPublicData( friendship_data['requested_friend'][0] );
			}).filter(acc => acc !== null) as PublicAccountSchema[];
			
			return {error: ERROR_CODES.SUCCESS, requested_friends};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async insertAccountFriendRequest(from_hex: string, to_hex: string) {
		try {
			const from_id = ObjectId.createFromHexString(from_hex);
			const to_id = ObjectId.createFromHexString(to_hex);
			
			//make sure that same friendship does not exists already
			let find_res = await getCollection(COLLECTIONS.friendships).findOne({
				$or: [//check both ways
					{
						from: from_id,
						to: to_id
					}, {
						from: to_id,
						to: from_id
					}
				]
			});
			if(find_res)
				return {error: ERROR_CODES.FRIENDSHIP_ALREADY_EXISTS};
			
			let insert_res = await getCollection(COLLECTIONS.friendships).insertOne({
				from: from_id,
				to: to_id,
				accepted: false
			});
			
			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async removeFriendship(friend1_id: string, friend2_id: string) {
		try {
			let id1 = ObjectId.createFromHexString(friend1_id);
			let id2 = ObjectId.createFromHexString(friend2_id);
			
			let remove_res = await getCollection(COLLECTIONS.friendships).deleteOne({
				$or: [
					{
						from: id1,
						to: id2
					}, {
						from: id2,
						to: id1
					}
				]
			});
			if( !remove_res.result.ok || !remove_res.deletedCount )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async acceptFriendship(friend1_id: string, friend2_id: string) {
		try {
			let id1 = ObjectId.createFromHexString(friend1_id);
			let id2 = ObjectId.createFromHexString(friend2_id);
			
			let update_res = await getCollection(COLLECTIONS.friendships).updateOne({
				$or: [
					{
						from: id1,
						to: id2
					}, {
						from: id2,
						to: id1
					}
				]
			}, {
				$set: {
					accepted: true
				}
			});
			if( !update_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async insertMessage(friendship_hex: string, is_left_friend: boolean, content: string, timestamp: number) {
		try {
			let insert_res = await getCollection(COLLECTIONS.social_messages).insertOne({
				friendship_id: ObjectId.createFromHexString(friendship_hex),
				left: is_left_friend,
				timestamp,
				content
			});
			
			if( !insert_res.result.ok )
				return {error: ERROR_CODES.DATABASE_ERROR};
			return {error: ERROR_CODES.SUCCESS, id: insert_res.insertedId.toHexString()};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async loadSocialMessages(friendship_hex: string) {
		try {
			let messages_raw = await getCollection(COLLECTIONS.social_messages).aggregate([
				{
					$match: {
						friendship_id: ObjectId.createFromHexString(friendship_hex)
					}
				}, {
					$sort: {timestamp: -1}
				}, {
					$project: {
						_id: 1,
						left: 1,
						timestamp: 1,
						content: 1
					}
				}, {
                    $limit: 128 //TODO: move to config
                }
			]).toArray();
			
			let messages = messages_raw.map(msg => {
				return {
					id: (msg['_id'] as ObjectId).toHexString(),
					left: msg['left'],
					timestamp: msg['timestamp'],
					content: [ msg['content'] ]
				}
			}) as SocialMessage[];
			
			return {error: ERROR_CODES.SUCCESS, messages};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	}
}