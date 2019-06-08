import {MongoClient, Db/*, ObjectId*/} from 'mongodb';
import Utils from './utils';
import ERROR_CODES from '../common/error_codes';

const uri = 'mongodb://localhost:27017';
const DB_NAME = 'BertaSnakes';

const enum COLLECTIONS {
	accounts = 'accounts',
	sessions = 'sessions'
};

let client: MongoClient;
let db: Db;
function assert_connection() {
	if(!client) throw new Error('Database connection not ready');
}

var connection_listeners: (() => void)[] = [];

function getCollection(name: string) {
	assert_connection();
	return (db || (db = client.db(DB_NAME))).collection(name);
}

const mongodb_user = Utils.getArgument('MONGO_USER');
const mongodb_pass = Utils.getArgument('MONGO_PASS');

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

	//creating indexes
	await db.collection(COLLECTIONS.accounts).createIndex({id: 1}, 
		{name: 'account_id', unique: true});
	await db.collection(COLLECTIONS.accounts).createIndex({username: 'hashed'}, 
		{name: 'username_index'});//NOTE - hashed index cannot be unique at the momment
	await db.collection(COLLECTIONS.accounts).createIndex({password: 'hashed'}, 
		{name: 'password_index'});

	await db.collection(COLLECTIONS.sessions).createIndex({account_id: 1}, 
		{name: 'account_session', unique: true});
	await db.collection(COLLECTIONS.sessions).createIndex({token: 'hashed'}, 
		{name: 'session_token'});
}).catch(console.error);

/*interface MongoForumAccountInfo extends ForumAccountInfo {
	_id: ObjectId;
	visit_counter: number;
}*/

export default {
	onConnect(callback: () => void) {
		if(client)
			callback();
		else
			connection_listeners.push(callback);
	},

	disconnect() {
		assert_connection();
		client.close();
	},

	async clearExpiredSessions() {
		let res = await getCollection(COLLECTIONS.sessions).deleteMany({
			expiration: {'$lte': Date.now()}
		});

		if((res.deletedCount||0) > 0)
			console.log('Expired sessions removed:', res.deletedCount);
	},

	async addSession(_account_id: number, _token: string, _expiration_date: number) {
		try {
			let sessions = getCollection(COLLECTIONS.sessions);

			//first - remove previous session account session if one exists
			await sessions.deleteOne({
				account_id: _account_id
			});

			let res = await sessions.insertOne({
				account_id: _account_id,
				token: _token,
				expiration: _expiration_date
			});

			if(!res.result.ok)
				return {error: ERROR_CODES.DATABASE_ERROR};
			else
				return {error: ERROR_CODES.SUCCESS};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.UNKNOWN};
		}
	},

	async getSession(_token: string) {
		try {
			let session_data = await getCollection(COLLECTIONS.sessions).findOne({
				token: _token
			});
			if(session_data && session_data.expiration > Date.now() && 
				typeof session_data.account_id === 'number') 
			{
				return session_data.account_id as number;
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
				return {error: ERROR_CODES.SUCCESS, id: account.id, username: account.username};
			else
				return {error: ERROR_CODES.INCORRECT_PASSWORD};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.UNKNOWN};
		}
	},

	async getAccount(_id: number) {
		try {
			let account = await getCollection(COLLECTIONS.accounts).findOne({id: _id},
				{projection: {id: 1, username: 1}});

			return account;
		}
		catch(e) {
			console.error(e);
			return null;
		}
	}

	/*
	async getRequestsByStatus(_status: string) {
		let wl_requests = getCollection(COLLECTIONS.wl_requests);
		
		const REQUEST_LIFETIME = 1000 * 60 * 60 * 24 * 7 * 4;//4 weeks
		let result = await wl_requests.aggregate([
			{ $match: {
				status: _status, 
				timestamp: { $gt: Date.now() - REQUEST_LIFETIME} 
			} },
			{ $sort: {timestamp: -1} },
			{
				$lookup: {
					from: COLLECTIONS.forum_accounts,
					localField: 'user_id',
					foreignField: 'id',
					as: 'forum_user'
				}
			},
			{ $project: {
				_id: 1,
				user_id: 1,
				timestamp: 1,
				status: 1,
				answers: {
					nick_input: 1,
					data_ur: 1
				},
				forum_user: {
					name: 1, avatar: 1
				}
			} }
		]).toArray();

		let counts = await wl_requests.aggregate([
			{ $group: {
				_id: '$status',
				count: {$sum: 1}
			} }
		]).toArray();

		//console.log(result, result.map(res => res.forum_user));
		return {result, counts};
	},

	async getRequestDetails(id: string) {
		let wl_requests = getCollection(COLLECTIONS.wl_requests);

		const target_id = ObjectId.createFromHexString(id);

		const lookup = {
			from: COLLECTIONS.forum_accounts,
			localField: 'user_id',
			foreignField: 'id',
			as: 'forum_user'
		};

		const project = {
			_id: 1,
			user_id: 1,
			timestamp: 1,
			status: 1,
			answers: 1,//include all answers
			forum_user: {
				name: 1, avatar: 1
			}
		};

		let result = await wl_requests.aggregate([
			{ $match: {_id: target_id} },
			{ $lookup: lookup },
			{ $project: project }
		]).next();

		//get every other request of this user
		let _other_user_requests = await wl_requests.aggregate([
			{ $match: { user_id: result.user_id, _id: {$ne: target_id} } },
			{ $sort: {timestamp: -1} },
			{ $lookup: lookup },
			{ $project: project }
		]).toArray();
		//console.log(other_user_requests);

		return {request: result, other_user_requests: _other_user_requests};
	}*/
}