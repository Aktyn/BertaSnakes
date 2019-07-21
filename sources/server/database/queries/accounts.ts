import {ObjectId} from 'mongodb';
import Config from '../../../common/config';
import Sessions from './sessions';
import {COLLECTIONS, extractUserPublicData, getCollection, AccountSchema} from "..";
import ERROR_CODES from "../../../common/error_codes";
import {onAccountInserted} from "../cached";
import {escapeRegExp} from "../../utils";

function extractAccountSchema(account: any): AccountSchema {
	return {
		...extractUserPublicData(account),
		
		email: account.email || '',
		verified: account.verification_code === '',
		admin: !!account.admin,//NOTE: it is important to make sure it is a boolean
		
		coins: account.coins || 0,

		available_skills: account.available_skills || [],
		available_ships: account.available_ships || [],
	};
}

export default {
	async login(_username: string, _password: string) {
		try {
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				username: new RegExp(`^${escapeRegExp(_username)}$`, 'i')
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
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXIST};
			
			return {error: ERROR_CODES.SUCCESS, data: extractUserPublicData(user)};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},

	async getAccountFromToken(_token: string) {
		try {
			let session_data = await getCollection(COLLECTIONS.sessions).findOne({
				token: _token
			});
			if (!session_data || session_data.expiration <= Date.now() || typeof session_data.account_id !== 'object')
				return {error: ERROR_CODES.SESSION_EXPIRED};
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				_id: session_data.account_id
			});
			if (!account)
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXIST};
			return {error: ERROR_CODES.SUCCESS, account: extractAccountSchema(account)};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async getAccountFromEmail(_email: string) {
		try {
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				email: _email
			});
			if (!account)
				return {error: ERROR_CODES.EMAIL_IS_NOT_REGISTERED};
			return {error: ERROR_CODES.SUCCESS, account: extractAccountSchema(account)};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
	
	async updateAccountPassword(account_hex_id: string, new_password: string) {
		try {
			let update_res = await getCollection(COLLECTIONS.accounts).updateOne({
				_id: ObjectId.createFromHexString(account_hex_id)
			}, {
				$set: {
					password: new_password
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
			
			onAccountInserted();
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
			let session_account_id = await Sessions.getSession(session_token);
			if(!session_account_id)
				return {error: ERROR_CODES.ACCOUNT_NOT_LOGGED_IN};

			const accounts = getCollection(COLLECTIONS.accounts);
			const object_id = ObjectId.createFromHexString(session_account_id);
			let account = await accounts.findOne({
				_id: object_id
			});
			if(!account)
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXIST};
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
			let session_account_id = await Sessions.getSession(session_token);
			if (!session_account_id)
				return {error: ERROR_CODES.ACCOUNT_NOT_LOGGED_IN};
			
			let account = await getCollection(COLLECTIONS.accounts).findOne({
				_id: ObjectId.createFromHexString(session_account_id)
			});
			if (!account)
				return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXIST};
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
	
	async searchAccount(_username: string) {
		try {
			let accounts = await getCollection(COLLECTIONS.accounts).aggregate([
				{
					$match: {
						username: new RegExp(`.*${escapeRegExp(_username)}.*`, 'i')//*username*
					}
				}, {
					$limit: 64
				}
			]).toArray();
			
			return {
				error: ERROR_CODES.SUCCESS,
				accounts: accounts.map(account => extractUserPublicData(account))
			};
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.DATABASE_ERROR};
		}
	},
}