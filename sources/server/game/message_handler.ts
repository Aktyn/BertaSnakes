import Connections, {Connection} from './connections';
import NetworkCodes, {NetworkPackage} from '../../common/network_codes';
import ERROR_CODES from '../../common/error_codes';
import Database from '../database';
import {AccountSchema2UserCustomData} from '../utils';

import RoomManager from './rooms_manager';
import GameStarter from './game_starter';

function findDuplicateSession(account_id: string) {
	return new Promise((resolve: (result: boolean) => void) => {
		Connections.forEachAccountUser(connection => {
			if(connection.user && connection.user.account_id === account_id)
				resolve(true);
		});
		resolve(false);
	});
}

async function loginAsUser(connection: Connection, token: string) {
	let res = await Database.getAccountFromToken(token);
	if(res.error !== ERROR_CODES.SUCCESS || !res.account)//LOGIN AS GUEST
		connection.loginAsGuest();
	else {
		if( await findDuplicateSession(res.account.id) ) {
			connection.loginAsGuest();
			connection.sendAccountAlreadyLoggedInError();
		}
		else
			connection.loginAsUser(res.account.id, token, AccountSchema2UserCustomData(res.account));
	}
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
				if(typeof data.token !== 'string' || connection.user.session_token !== data.token) {
					if( connection.getRoom() )
						RoomManager.leaveRoom(connection);
					connection.loginAsGuest();
				}
				else {
					let account_schema = await Database.getAccount(connection.user.account_id);
					if(!account_schema)
						throw new Error('Account not found in database, id: ' + connection.user.account_id);
					connection.updateUserData( AccountSchema2UserCustomData(account_schema) );
				}
			}
			else {
				if(typeof data.token === 'string') {//user just logged in
					if( connection.getRoom() )
						RoomManager.leaveRoom(connection);
					loginAsUser(connection, data.token).catch(e => console.error('Cannot login as user:', e));
				}
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
		case NetworkCodes.USER_KICK_REQUEST:
			if(typeof data.user_id === 'number')
				RoomManager.kickUser(connection, data.user_id);
			break;
		case NetworkCodes.ROOM_SETTINGS_UPDATE_REQUEST:
			if(typeof data.name === 'string' && typeof data.map === 'string' && 
				typeof data.gamemode === 'number' && typeof data.sits_number === 'number' && 
				typeof data.duration === 'number' && typeof data.max_enemies === 'number')
			{
				RoomManager.updateRoomSettings(connection, data as never);
			}
			break;
		case NetworkCodes.SIT_REQUEST:
			RoomManager.sitUser(connection);
			break;
		case NetworkCodes.STAND_REQUEST:
			RoomManager.stand(connection);
			break;
		case NetworkCodes.READY_REQUEST:
			RoomManager.readyUser(connection);
			break;
		case NetworkCodes.SEND_ROOM_CHAT_MESSAGE:
			if(typeof data.msg === 'string')
				RoomManager.sendRoomMessage(connection, data.msg);
			break;
		case NetworkCodes.START_GAME_CONFIRMATION: {
			let room = connection.getRoom();
			if(!room)
				break;
			let game = GameStarter.getRunningGame(room.id);
			if(game)
				game.onConfirmation( connection );
		}	break;
	}
}

export function handleByteBuffer(connection: Connection, message: any) {
	let room = connection.getRoom();
	if(connection.user && room && room.game_handler)
		room.game_handler.send({user_id: connection.user.id, data: message});
}

export function onDisconnect(connection: Connection) {
	if( connection.getRoom() )
		RoomManager.leaveRoom(connection);
}