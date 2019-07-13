import {AccountSchema} from "../core";


export default {
	registerVisit(account: AccountSchema | null, user_agent: string, ip: string) {
		console.log(account, user_agent, ip);
		//TODO
	}
}