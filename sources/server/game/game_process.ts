declare global {
	namespace NodeJS {
		export interface Global {
			_CLIENT_: boolean;
			_SERVER_: boolean;
		}
	}
}
global._CLIENT_ = false;
global._SERVER_ = true;

import ServerGame from './server_game';

import RoomInfo from '../../common/room_info';
import UserInfo, {UserFullData} from '../../common/user_info';
import Maps, {onMapsLoaded} from '../../common/game/maps';

console.log = (function(MSG_PREFIX) {
	const log = console.log;//preserve
	return function() { log.apply(console, [MSG_PREFIX, ...arguments]); };
})( '[Game#'+process.pid+'] =>' );

console.log('Child process initialized');

let game: ServerGame | null = null;

//invokes callback when game is running
let waitForGameInitialize = (callback: (game: ServerGame) => void) => {
	if(game)
		console.log(game.initialized);
	if(game !== null && game.initialized)
		callback(game);
	else
		setTimeout(waitForGameInitialize, 100, callback);
};

interface MessageSchema {
	user_id: number;
	action: string;
	data: any;
	room_info: string;
	playing_users: UserFullData[]
}

process.on('message', function(msg: MessageSchema) {
	//console.log(msg);
	if(msg.user_id) {//message from client
		try {
			//@ts-ignore
			game.onClientMessage(msg.user_id, msg.data.data);
		}
		catch(e) {
			console.error('cannot process byte data from client:');
			console.error(e);
		}
	}
	else {
		//@msg - {action, ...} where @action - string representing given action
		switch(msg.action) {
			case 'init_game'://TODO - const enum actions instead of strings
				console.log('Initializing server-side game');

				let room = RoomInfo.fromJSON( msg.room_info );
				msg.playing_users.forEach((user) => room.addUser( UserInfo.fromFullJSON(user) ));

				onMapsLoaded(() => {//make sure maps data is loaded
					try {
						if( !(room.map in Maps) ) {
							console.error('Given map is not available:', room.map);
							process.exit();
							return;
						}
						game = new ServerGame(Maps[room.map], room);

						setTimeout(function() {
							console.log('Game lifetime expired. Canceling process');
							process.exit();
						}, 1000 * 60 * 40);//40 minutes (maximum game lifetime)
					}
					catch(e) {
						console.error('Initializing game error:', e);
						process.exit();
						//process.send( {action: NetworkCodes.START_GAME_FAIL_ACTION} );
					}
				});

				//console.log(room);
				break;
			case 'run_game':
				console.log('Running game');
				waitForGameInitialize( game => game.start() );
				break;
		}
	}
});