global._CLIENT_ = false;

const RoomInfo = require('./../include/room_info.js');
const UserInfo = require('./../include/user_info.js');
//const NetworkCodes = require('./../include/network_codes.js');

const ServerGame = require('./server_game.js');
const Maps = require('./../include/game/maps.js');

console.log = (function(MSG_PREFIX) {
	const log = console.log;//preserve
	return function() { log.apply(console, [MSG_PREFIX, ...arguments]); };
})( '[Game#'+process.pid+'] =>' );

console.log('Child process initialized');

var game = null;

let waitForGameInitialize = callback => {//invokes callback when game is running
	if(game != null && game.initialized === true)
		callback();
	else
		setTimeout(waitForGameInitialize, 100, callback);
};

process.on('message', function(msg) {
	//console.log(msg);
	if(msg.user_id) {//message from client
		//@msg - {user, data} where @user - instance of UserInfo, @binary_data - Uint8Array
		//console.log(msg);
		try {
			game.onClientMessage(msg.user_id, msg.data.data);
		}
		catch(e) {
			console.error('cannot process byte data from client:', e);
		}
	}
	else {
		//@msg - {action, ...} where @action - string representing given action
		switch(msg.action) {
			case 'init_game':
				console.log('Initializing server-side game');

				var room = RoomInfo.fromJSON( msg.room_info );
				msg.users.forEach(user => room.addUser( UserInfo.fromFullJSON(user) ));

				Maps.onLoad(() => {//make sure maps data is loaded
					try {
						game = new ServerGame(Maps.getByName(room.map), room);

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
				waitForGameInitialize( () => game.start() );
				
				break;
		}
	}
});

// setInterval(() => console.log('x'), 2000);