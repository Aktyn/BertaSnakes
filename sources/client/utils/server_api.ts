import Config from '../../common/config';

//@ts-ignore
const HOST = window.SERVER_HOST || Config.api_server_url;
console.log('Server host:', HOST);

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
			//if(process.env.NODE_ENV === 'development')
			//	console.error(e);
			return false;
		}
	}
}