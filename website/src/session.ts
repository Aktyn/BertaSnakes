namespace Session {
	interface AccountDataBase {
		ID: number;
		NICK: string;
		EMAIL: string;
		AVATAR: string | null;
		REGISTER_DATE: string;
		LAST_SEEN: string;
		CUSTOM_DATA: string;
	}

	interface AccountData extends AccountDataBase {
		LEVEL: number;
		RANK: number;
	}

	var data: AccountData | null = null;

	interface SessionJSON extends AccountData {
		result: string;
	}

	export function set(res: SessionJSON) {
		let logged_in = res.result === 'SUCCESS';
		if(logged_in === false)//remove cookie
			document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		else {
			data = res;

			try {
				data.LEVEL = JSON.parse(res.CUSTOM_DATA).level | 0;
				data.RANK = ( JSON.parse(res.CUSTOM_DATA).rank || 1000 ) | 0;
			}
			catch(e) {
				console.error(e);
				data.LEVEL = 0;
				data.RANK = 0;
			}
		}
	}

	export function getData() {
		if(data === null)
			throw Error("No Session - no data");
		return data;
	}

	export function loggedIn() {
		return data !== null;
	}

	export function setAvatar(avatar: string) {
		if(data)
			data.AVATAR = avatar;
	}

	export function clearAvatar() {
		if(data)
			data.AVATAR = null;
	}

	export function clear() {
		data = null;
	}
}