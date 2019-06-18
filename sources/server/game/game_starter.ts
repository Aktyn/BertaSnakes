/* Starts counter to game start and distributes counter updates to room users per second */

import RoomInfo from '../../common/room_info';
import GameHandler from './game_handler';
// import UserInfo from '../../common/user_info';
// import NetworkCodes from '../../common/network_codes';

interface GameProcessSchema {

}

let currentCountdowns: Map<number, NodeJS.Timeout> = new Map();
let running_games: Map<number, GameProcessSchema> = new Map();

function distributeCountdownUpdate(room: RoomInfo, time: number | null) {
	room.forEachUser(user => {
		if(!user.connection)
			return;
		user.connection.sendCountdown(room.id, time);
	});
}

function prepareToStart(room: RoomInfo) {
	if( running_games.has(room.id) )
		throw new Error('Game with given id already running: ' + room.id);

	running_games.set(room.id, new GameHandler(room, () => {
		running_games.delete(room.id);
	}));
}

//invokes per second for each counter
function tick(room: RoomInfo, remaining_time: number) {
	//if not everyone is ready
	if( !room.everyoneReady() ) {
		//breaking countdown
		currentCountdowns.delete(room.id);
		distributeCountdownUpdate(room, null);
		return;
	}

	if(remaining_time <= 0) {
		//STARTING GAME
		currentCountdowns.delete(room.id);
		prepareToStart(room);
	}
	else {
		//distribute counter update
		distributeCountdownUpdate(room, remaining_time);

		let tm = setTimeout(function() {
			tick(room, remaining_time-1);
		}, 1000);
		currentCountdowns.set(room.id, tm);//update countdown function
	}
}

export default {
	start_countdown(room: RoomInfo, duration: number) {
		let current = currentCountdowns.get(room.id);
		if( current ) {
			clearTimeout( current );
			currentCountdowns.delete(room.id);
		}
		
		tick(room, duration);
	}
}