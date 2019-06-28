import ServerApi from './utils/server_api';
import ERROR_CODES from '../common/error_codes';
import Cookies from './utils/cookies';

import {UserCustomData} from "../common/user_info";

import {AccountSchema} from '../server/database';
export {AccountSchema} from '../server/database';

let current_account: AccountSchema | null = null;
let on_login_listeners: ((account: AccountSchema | null) => void)[] = [];

const override = (value: any, current: any) => value === undefined ? current : value;

function onLogIn(account: AccountSchema | null) {
	//console.log(account);
	current_account = account;
	on_login_listeners.forEach(l => l(account));
}

async function loginFromToken() {
	if(current_account)
		return {error: ERROR_CODES.ACCOUNT_ALREADY_LOGGED_IN};
	try {
		let res = await ServerApi.postRequest('/token_login', {token});

		if(res.error === ERROR_CODES.SUCCESS && typeof res.account === 'object' &&
			typeof res.account.id === 'string' && typeof res.account.username === 'string') 
		{
			onLogIn(res.account);
			console.log('Logged in via token', current_account);
			return {error: ERROR_CODES.SUCCESS};
		}
		else
			return {error: res.error || ERROR_CODES.UNKNOWN};
	}
	catch(e) {
		if(process.env.NODE_ENV === 'development')
			console.error(e);
		return {error: ERROR_CODES.SERVER_UNREACHABLE};
	}
}

let token = Cookies.getCookie('token');
if(token) //try to login via cookie token
	loginFromToken().catch(console.error);

export default {
	getAccount() {//null if user is not logged in
		return current_account;
	},

	getToken() {
		return token;
	},

	addLoginListener(listener: (account: AccountSchema | null) => void) {
		on_login_listeners.push( listener );
		if(current_account)
			listener(current_account);
	},

	removeLoginListener(listener: (account: AccountSchema | null) => void) {
		let listener_i = on_login_listeners.indexOf(listener);
		on_login_listeners.splice(listener_i, 1);
	},

	loginFromToken,
	
	updateCustomData(data: Partial<UserCustomData>) {
		if( !current_account )
			return;
		
		current_account.level           = override(data.level, current_account.level);
		current_account.rank            = override(data.rank, current_account.rank);
		current_account.skills          = override(data.skills, current_account.skills);
		current_account.ship_type       = override(data.exp, current_account.ship_type);
		current_account.exp             = override(data.exp, current_account.exp);
		current_account.coins           = override(data.coins, current_account.coins);
		current_account.available_skills= override(data.available_skills, current_account.available_skills);
		current_account.available_ships = override(data.available_ships, current_account.available_ships);
		current_account.total_games     = override(data.total_games, current_account.total_games);
	},

	async login(nick: string, password: string) {
		try {
			let res = await ServerApi.postRequest('/login', {nick, password});
			if(res.error)
				return res;
			if(!res.token || !res.expiration_time || !res.account)
				return {error: ERROR_CODES.INCORRECT_SERVER_RESPONSE};

			onLogIn(res.account);

			this.setToken(res.token, res.expiration_time);

			return res;
		}
		catch(e) {
			return {error: ERROR_CODES.SERVER_UNREACHABLE};
		}
	},

	async register(nick: string, password: string, email: string) {
		try {
			let res = await ServerApi.postRequest('/register', {nick, password, email});
			if(res.error)
				return res;
		}
		catch(e) {
			return {error: ERROR_CODES.SERVER_UNREACHABLE};
		}

		//automatically log in after creating account
		return await this.login(nick, password);
	},

	async requestVerificationCode() {
		try {
			if(!current_account)
				return {error: ERROR_CODES.NOT_LOGGED_IN};
			let res = await ServerApi.postRequest('/request_verification_code', {token});
			if(res.error === ERROR_CODES.ACCOUNT_ALREADY_VERIFIED)
				current_account.verified = true;
			return res;
		}
		catch(e) {
			console.error(e);
			return {error: ERROR_CODES.SERVER_UNREACHABLE};
		}
	},

	async verify(code: string) {
		try {
			if(!current_account)
				return {error: ERROR_CODES.NOT_LOGGED_IN};
			let res = await ServerApi.postRequest('/verify', {token, code});
			if(res.error === ERROR_CODES.SUCCESS)
				current_account.verified = true;
			return res;
		}
		catch(e) {
			return {error: ERROR_CODES.SERVER_UNREACHABLE};
		}
	},

	//null in argument means - clear avatar
	async uploadAvatar(image_data: string | null) {//URL encoded image data
		try {
			if(!current_account)
				return {error: ERROR_CODES.NOT_LOGGED_IN};
			let res = await ServerApi.postRequest('/upload_avatar', {
				token,
				image: image_data
			});
			
			if( (typeof res.avatar === 'string') || res.avatar === null)
				current_account.avatar = res.avatar;

			return res;
		}
		catch(e) {
			return {error: ERROR_CODES.SERVER_UNREACHABLE};
		}
	},

	logout() {
		Cookies.removeCookie('token');
		token = null;
		onLogIn(null);
		//TODO - send request to server for removing session
	},

	setToken(_token: string, _expires: number) {
		token = _token;
		Cookies.setCookie('token', _token, _expires);
	}
}