import Config from '../../common/config';

//@ts-ignore
const HOST = window.SERVER_HOST || Config.api_server_url;
console.log('Server host:', HOST);

const no_avatar_img = require('../img/icons/account.svg');

let last_salt_update_timestamp = 0;
// noinspection SpellCheckingInspection
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
let last_salt: string = salt();
function salt() {//returns short random string
	if(Date.now() - last_salt_update_timestamp < 1000*30)//30 seconds
		return last_salt;
	let new_salt = new Array(8).fill(0)
		.map(() => CHARS[(Math.random()*CHARS.length)|0]).join('');
	last_salt_update_timestamp = Date.now();
	//console.log('new salt:', new_salt);
	last_salt = new_salt;
	return new_salt;
}

function postRequest(to: string, data: string | {[index: string]: any}) {
	if(!to.startsWith('/')) to = '/' + to;

	if(typeof data !== 'string')
		data = JSON.stringify(data);

	return fetch(HOST + to, {
		method: "POST",
		mode: 'cors',//'cors' : 'same-origin',
		headers: {"Content-Type": "application/json; charset=utf-8"},
		body: data
	}).then(res => res.json());
}

export default {
	postRequest,
	
	async pingServer() {
		try {
			let res = await postRequest('/ping', {});
			return res.error === 0;//success
		}
		catch(e) {
			return false;
		}
	},

	getAvatarPath(avatar: string | null) {
		if(avatar === null)
			return no_avatar_img;
		return `${Config.api_server_url}/uploads/avatars/${avatar}?${salt()}`;
	},

	forceNewSalt() {
		last_salt_update_timestamp = 0;
	}
}