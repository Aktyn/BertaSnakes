import {Connection} from './connections';
import NetworkCodes, {NetworkPackage} from '../../common/network_codes';
import ERROR_CODES from '../../common/error_codes';
import Database, {AccountSchema} from '../database';
import {UserCustomData} from '../../common/user_info';
import RoomManager from './rooms_manager';

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

async function loginAsUser(connection: Connection, token: string) {
	let res = await Database.getAccountFromToken(token);
	if(res.error !== ERROR_CODES.SUCCESS || !res.account)//LOGIN AS GUEST
		connection.loginAsGuest();
	else
		connection.loginAsUser(res.account.id, token, AccountSchema2UserCustomData(res.account));
}

export async function handleJSON(connection: Connection, data: NetworkPackage) {
	//if(connection.user === null)
	//	throw new Error(`Connection's user doesn't exist`);

	switch(data.type) {
		default: 
			console.error('Incorrect type value in JSON message');
			break;
		case NetworkCodes.LOGIN: {//data.token: string | null
			if(typeof data.token === 'string')
				await loginAsUser(connection, data.token);
			else//LOGIN AS GUEST
				connection.loginAsGuest();
		}	break;

		case NetworkCodes.ACCOUNT_DATA_REQUEST://authenticating via session token
			if(!connection.user)
				break;
			if(!connection.user.isGuest() && connection.user.account_id) {
				//user logged out or session expired
				if(typeof data.token !== 'string' || connection.user.session_token !== data.token)
					connection.loginAsGuest();
				else {
					let account_schema = await Database.getAccount(connection.user.account_id);
					if(!account_schema)
						throw new Error('Account not found in database, id: '+connection.user.account_id);
					connection.updateUserData( AccountSchema2UserCustomData(account_schema) );
				}
			}
			else {
				if(typeof data.token === 'string')//user just logged in
					loginAsUser(connection, data.token);
				else
					connection.updateUserData(null);
			}
			break;
		case NetworkCodes.CREATE_ROOM_REQUEST:
			RoomManager.createRoom(connection);
			break;
		case NetworkCodes.ROOM_LIST_REQUEST:
			RoomManager.sendRoomsList(connection);
			break;
		case NetworkCodes.JOIN_ROOM_REQUEST:
			if(typeof data.id === 'number')
				RoomManager.joinRoom(connection, data.id);
			break;
		case NetworkCodes.LEAVE_ROOM_REQUEST:
			RoomManager.leaveRoom(connection);
			break;
	}
}

export function onDisconnect(connection: Connection) {
	if( connection.getRoom() )
		RoomManager.leaveRoom(connection);
}