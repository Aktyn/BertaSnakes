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
import {UserJsonI} from './../common/user_info';

import RoomInfo from './../common/room_info';
import UserInfo from './../common/user_info';
import Maps, {onMapsLoaded} from './../common/game/maps';

console.log = (function(MSG_PREFIX) {
	const log = console.log;//preserve
	return function() { log.apply(console, [MSG_PREFIX, ...arguments]); };
})( '[Game#'+process.pid+'] =>' );

console.log('Child process initialized');

var game: ServerGame | null = null;

let waitForGameInitialize = (callback: () => void) => {//invokes callback when game is running
	if(game !== null && game.initialized === true)
		callback();
	else
		setTimeout(waitForGameInitialize, 100, callback);
};

interface MessageSchema {
	user_id: number;
	action: string;
	data: any;
	room_info: string;
	users: UserJsonI[]
}

process.on('message', function(msg: MessageSchema) {
	//console.log(msg);
	if(msg.user_id) {//message from client
		try {
			//console.log('TEST');
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
			case 'init_game':
				console.log('Initializing server-side game');

				var room = RoomInfo.fromJSON( msg.room_info );
				msg.users.forEach((user) => room.addUser( UserInfo.fromFullJSON(user) ));

				onMapsLoaded(() => {//make sure maps data is loaded
					try {
						game = new ServerGame(Maps[room.map], room);

						setTimeout(function() {
							console.log('Game lifetime expired. Canceling process');
							process.exit();//TODO - onexit event in core.js
						}, 1000 * 60 * 40);//40 minutes (maximum game lifetime)
					}
					catch(e) {
						console.error('TODO - handle this impossible error', e);
						process.exit();
						//process.send( {action: NetworkCodes.START_GAME_FAIL_ACTION} );
					}
				});

				//console.log(room);
				break;
			case 'run_game':
				console.log('Running game');
					
				waitForGameInitialize( () => {
					if(game !== null)
						game.start();
				});
				
				break;
		}
	}
});