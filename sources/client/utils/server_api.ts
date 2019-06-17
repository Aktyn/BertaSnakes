import Config from '../../common/config';

//@ts-ignore
const HOST = window.SERVER_HOST || Config.api_server_url;
console.log('Server host:', HOST);

const no_avatar_img = require('../img/icons/account.svg');

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
function salt() {//returns short random string
	return new Array(8).fill(0).map(a => CHARS[(Math.random()*CHARS.length)|0]).join('');
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
	}
}