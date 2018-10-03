/* Starts counter to game start and distributes counter updates to room users per second */

const GameStarter = (function() {
	const NetworkCodes = require('./../include/network_codes.js');
	const RoomInfo = require('./../include/room_info.js');

	var currentCountdowns = [];//stored room's ids

	function distributeCountdownUpdate(room, time) {
		try {
			room.users.forEach(room_user => {
				if(room_user.connection == null)
					throw new Error('room_user has not assigned connection handler');
				room_user.connection.send(JSON.stringify({
					'type': NetworkCodes.START_GAME_COUNTDOWN,
					'remaining_time': time
				}));
			});
		}
		catch(e) {
			console.log(e);
		}
	}

	function tick(room, remaining_time, onFinish) {//invokes per second for each counter
		if(currentCountdowns.indexOf(room.id) === -1)//countdown removed
			return;
		//checking if everyone is still ready
		if(room.everyoneReady() === false) {//if not
			//breaking countdown
			distributeCountdownUpdate(room, null);

			return;
		}

		if(remaining_time <= 0) {
			//STARTING GAME
			if(typeof onFinish === 'function')
				onFinish(room);
			else//if cannot send callback
				distributeCountdownUpdate(room, null);//sending countdown break message
		}
		else {
			//distribute counter update
			distributeCountdownUpdate(room, remaining_time);

			setTimeout(function() {
				tick(room, remaining_time-1, onFinish);
			}, 1000);
		}
	}

	return {
		start_countdown: function(room, duration, onFinish) {
			if(room instanceof RoomInfo === false)
				throw new Error('First argument must be RoomInfo instance');
			if(typeof duration !== 'number')
				throw new Error('Duration in seconds must be specified (typeof number)');
			if(typeof onFinish !== 'function')
				throw new Error('Callback function must be specified');

			let index = currentCountdowns.indexOf(room.id);
			if(index === -1) {
				currentCountdowns.push( room.id );
				tick(room, duration, onFinish);
			}
			else {//restarting countdown
				currentCountdowns.splice(index, 1);
				setTimeout(() => this.start_countdown(room, duration, onFinish), 1001);
			}
		}
	};
})();

module.exports = GameStarter;