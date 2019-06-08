import * as crypto from 'crypto';
import Database from './database';
import ERROR_CODES, {errorMsg} from '../common/error_codes';
import Config from '../common/config';

const MAX_LEN = 64;//same value as in account_sidepop.tsx

Database.onConnect(() => Database.clearExpiredSessions());

export default {
	async login(nick: string, password: string) {
		nick = nick.substr(0, MAX_LEN);
		const hashed_password = crypto.createHash('sha256')
			.update( password.substr(0, MAX_LEN) ).digest('base64');
		let res = await Database.login(nick, hashed_password);
		if(res.error)
			return {error: res.error};

		if(typeof res.id !== 'number') {
			console.error('Incorrect database response');
			return {error: ERROR_CODES.INCORRECT_DATABASE_RESPONSE};
		}
		
		//generate token
		const token = crypto.createHash('sha256')
			.update( Date.now().toString() + res.id + nick ).digest('base64');
		console.log(`token generated for user: ${nick} (${res.id})\n\ttoken: ${token}`);

		let expiration_time = Date.now() + Config.TOKEN_LIFETIME;
		let insert_res = await Database.addSession(res.id, token, expiration_time);
		if(insert_res.error) {
			console.error(errorMsg(insert_res.error));
			return {error: insert_res.error};
		}

		return {error: ERROR_CODES.SUCCESS, token, expiration_time, id: res.id, username: res.username};
	},

	async token_login(token: string) {
		let account_id = await Database.getSession(token);
		if(!account_id)
			return {error: ERROR_CODES.SESSION_EXPIRED};
		
		let account = await Database.getAccount(account_id);
		if(!account)
			return {error: ERROR_CODES.ACCOUNT_DOES_NOT_EXISTS};

		return {error: ERROR_CODES.SUCCESS, account};
	}
}