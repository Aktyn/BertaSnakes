const prompt = require('prompt-sync')();
import * as crypto from 'crypto';
import {AccountSchema} from "./database";
import {UserCustomData} from '../common/user_info';

export function getArgument(name: string) {
	for(let arg of process.argv) {
		if(arg.startsWith(name))
			return arg.replace(name, '').substring(1);
	}

	try {//ask user to type password in console
		return prompt(name + ': ') || '';
	}
	catch(e) {
		console.error(`Argument ${name} not found. Closing program.`);
		process.exit();
		return '';
	}
}

export function sha256(input: string) {
	return crypto.createHash('sha256').update( input ).digest('base64');
}

export function md5(input: string) {
	return crypto.createHash('md5').update( input ).digest('base64');
}

/*export function encodeBase64(input: string) {
	return Buffer.from(input).toString('base64');;
}*/

export function AccountSchema2UserCustomData(account: AccountSchema): UserCustomData {
	return {
		nick: account.username,
		level: account.level,
		rank: account.rank,
		avatar: account.avatar,

		verified: account.verified,
		exp: account.exp,
		coins: account.coins,
		
		available_skills: account.available_ships,
		skills: account.skills,

		available_ships: account.available_ships,
		ship_type: account.ship_type,
	};
}