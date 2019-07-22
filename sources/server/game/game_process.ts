declare global {
	namespace NodeJS {
		// noinspection JSUnusedGlobalSymbols
		export interface Global {
			_CLIENT_: boolean;
			_SERVER_: boolean;
		}
	}
}
global._CLIENT_ = false;
global._SERVER_ = true;

console.log = (function(MSG_PREFIX) {
	const log = console.log;//preserve
	return function() { log.apply(console, [MSG_PREFIX, ...arguments]); };
})( `[Process:${process.pid}] =>` );

console.log('Child process initialized');

//---------------------------------------------------------------------------------------//

import ServerGame from './server_game';

import RoomInfo, {RoomCustomData} from '../../common/room_info';
import UserInfo, {UserFullData} from '../../common/user_info';
import Maps, {onMapsLoaded} from '../../common/game/maps';
import NetworkCodes from '../../common/network_codes';

let games = new Map<number, ServerGame>();

//invokes callback when game is running
let waitForGameInitialize = (game: ServerGame, callback: () => void) => {
	if(game.initialized)
		callback();
	else
		setTimeout(() => waitForGameInitialize(game, callback), 100);
};

export const enum PROCESS_ACTIONS {
	INIT_GAME = 0,
	START_GAME,
	ON_GAME_END
}

export interface MessageFromClient {
	user_id: number;
	data: any;
	room_id: number;
}

interface InitGameMessage {
	action: PROCESS_ACTIONS.INIT_GAME;
	room_info: RoomCustomData;
	playing_users: UserFullData[];
}

interface RunGameMessage {
	action: PROCESS_ACTIONS.START_GAME;
	room_id: number;
}

interface GameEndMessage {
	action: PROCESS_ACTIONS.ON_GAME_END;
	room_id: number;
}

type ActionMessages = InitGameMessage | RunGameMessage | GameEndMessage;

process.on('message', function(msg: MessageFromClient & ActionMessages) {
	//console.log(msg);
	if(msg.user_id) {//message from client
		try {
			//game.onClientMessage(msg.user_id, msg.data.data);
			//@ts-ignore
			(games.get(msg.room_id)).onClientMessage(msg.user_id, msg.data.data);
		}
		catch(e) {
			console.error('Cannot process byte data from client:', e);
		}
	}
	else {
		switch(msg.action) {
			case PROCESS_ACTIONS.INIT_GAME: {
				console.log('Initializing server-side game');
				
				const room = RoomInfo.fromJSON(msg.room_info);
				msg.playing_users.forEach((user) => room.addUser(UserInfo.fromFullJSON(user)));
				
				onMapsLoaded(() => {//make sure maps data is loaded
					try {
						if ( !(room.map in Maps) ) {
							console.error('Given map is not available:', room.map);
							//process.exit();
							return;
						}
						
						if( games.has(room.id) ) {
							console.error('Game with given id is already initialized: ' + room.id);
							return;
						}
						let new_game = new ServerGame(Maps[room.map], room);
						games.set(room.id, new_game);
						
					} catch (e) {
						console.error('Initializing game error:', e);
						//process.exit();
						// @ts-ignore
						process.send({action: NetworkCodes.START_GAME_FAIL_ACTION});
					}
				});
				
				//console.log(room);
			}   break;
			case PROCESS_ACTIONS.START_GAME: {
				let game_to_start = games.get(msg.room_id);
				if(!game_to_start) {
					console.error('Cannot find game with given id to run: ' + msg.room_id);
					// @ts-ignore
					process.send({action: NetworkCodes.START_GAME_FAIL_ACTION});
					return;
				}
				console.log('Running game');
				waitForGameInitialize(game_to_start, () => {
					if(game_to_start)
						game_to_start.start();
					else
						throw new Error('Impossible error');
				});
			}   break;
			case PROCESS_ACTIONS.ON_GAME_END: {
				console.log('game ended:', msg.room_id);
				games.delete(msg.room_id);
			}   break;
		}
	}
});