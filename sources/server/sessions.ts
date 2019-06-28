import Database from './database';
import ERROR_CODES, {errorMsg} from '../common/error_codes';
import Config from '../common/config';
import {sha256} from './utils';

Database.onConnect(() => Database.clearExpiredSessions());

export default {
	async login(nick: string, password: string) {
		nick = nick.substr(0, Config.MAX_LOGIN_LENGTH);
		const hashed_password = sha256(password.substr(0, Config.MAX_PASSWORD_LENGTH));
		let res = await Database.login(nick, hashed_password);
		if(res.error)
			return {error: res.error};

		if(typeof res.account !== 'object') {
			console.error('Incorrect database response');
			return {error: ERROR_CODES.INCORRECT_DATABASE_RESPONSE};
		}
		
		//generate token
		const token = sha256(Date.now().toString() + res.account.id + nick);
		console.log(`token generated for user: ${nick} (${res.account.id})\n\ttoken: ${token}`);

		let expiration_time = Date.now() + Config.TOKEN_LIFETIME;
		let insert_res = await Database.addSession(res.account.id, token, expiration_time);
		if(insert_res.error) {
			console.error(errorMsg(insert_res.error));
			return {error: insert_res.error};
		}

		Database.updateLastLoginTime(res.account.id).catch(console.error);

		return {error: ERROR_CODES.SUCCESS, token, expiration_time, account: res.account};
	},

	async token_login(token: string) {

		let login_result = await Database.getAccountFromToken(token);
		if(login_result.error === ERROR_CODES.SUCCESS && login_result.account)
			Database.updateLastLoginTime(login_result.account.id).catch(console.error);
		return login_result;
	}
}