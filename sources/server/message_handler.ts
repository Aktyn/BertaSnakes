
import {Connection} from './connections';
import NetworkCodes, {NetworkPackage} from '../common/network_codes';
import ERROR_CODES from '../common/error_codes';
import Database, {AccountSchema} from './database';
import {UserCustomData} from '../common/user_info';

function AccountSchema2UserCustomData(account: AccountSchema): UserCustomData {
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

export async function handleJSON(connection: Connection, data: NetworkPackage) {
	//if(connection.user === null)
	//	throw new Error('Connection\'s user doesn\'t exist');

	switch(data.type) {
		default: 
			console.error('Incorrect type value in JSON message');
			break;
		case NetworkCodes.LOGIN: {//data.token: string | null
			if(typeof data.token === 'string') {
				let res = await Database.getAccountFromToken(data.token);
				if(res.error !== ERROR_CODES.SUCCESS || !res.account)//LOGIN AS GUEST
					connection.loginAsGuest();
				else
					connection.loginAsUser(res.account.id, AccountSchema2UserCustomData(res.account));
			}
			else//LOGIN AS GUEST
				connection.loginAsGuest();
		}	break;

		case NetworkCodes.ACCOUNT_DATA_REQUEST:
			if(!connection.user)
				break;
			if(!connection.user.isGuest() && connection.user.account_id) {
				let account_schema = await Database.getAccount(connection.user.account_id);
				if(!account_schema)
					throw new Error('Account not found in database, id: ' + connection.user.account_id);
				connection.updateUserData( AccountSchema2UserCustomData(account_schema) );
			}
			else
				connection.updateUserData(null);
			break;
	}
};