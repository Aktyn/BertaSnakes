import RoomInfo from '../../common/room_info';
import {UserFullData} from '../../common/user_info';
import NetworkCodes from '../../common/network_codes';
import Connections, {Connection} from './connections';
import * as child_process from 'child_process';
import * as path from 'path';

//TODO: refactor this function
/*function saveGameResult(room: RoomInfo, result_json: GameResultJSON) {
	//console.log( room );
	//console.log( msg.data.result.players_results );

	//updating user's database entries according to game result
	if(typeof result_json === 'string')
		result_json = JSON.parse(result_json);

	result_json.players_results.forEach(result => {
		if(result.user_id < 0)//ignore guests
			return;
		
		let online_user_conn = current_connections.find((conn: Connection) => {
			return conn.user !== null && conn.user.id === result.user_id;
		});

		//if user is online there is no reason to fetch it's data from database
		if(online_user_conn !== undefined && online_user_conn.user !== null)
			updateAndSaveCustomData(online_user_conn.user.id, online_user_conn.user.custom_data,
				result);
		else {//update offline user according to game result
			DatabaseUtils.findUserByID(result.user_id).then(res => {
				if(res === null)
					throw new Error('Cannot find user in database, (id: ' + result.user_id + ')');
				
				//let custom_data = JSON.parse( res.custom_data );
				updateAndSaveCustomData(res.id, JSON.parse(res.custom_data), result);
			}).catch(e => console.error(e));
		}
	});

	//saving game result as database result
	var result_json_out = JSON.stringify(result_json);
	DatabaseUtils.saveGameResult(room.name, room.map, room.gamemode, room.duration, result_json_out);
}*/

function onGameFailedToStart(room: RoomInfo) {
	console.warn('Game failed to start:', room.id);

	room.unreadyAll();
	room.forEachUser(user => {
		if(user.connection)
			user.connection.sendGameStartFailEvent(room);
	});

	//make this rooms appear again at user's rooms list
	Connections.forEachLobbyUser(conn => conn.onRoomCreated(room));
}

interface GameProcessMessage {
	action: NetworkCodes;
	data: any;
}

export default class GameHandler {
	private onExit: (no_error: boolean) => void;
	private room: RoomInfo;
	private remaining_confirmations: number[];
	private game_started = false;

	constructor(_room: RoomInfo, _onExit: (no_error: boolean) => void) {
		this.onExit = _onExit;
		this.room = _room;

		//prepare confirmations system
		this.remaining_confirmations = [..._room.sits];

		setTimeout(() => {//after 10 seconds check if everyone confirmed game start
			if( !this.game_started ) {//if not started yet
				onGameFailedToStart(_room);
				this.onGameEnd();
			}
		}, 10 * 1000);

		//////////////////////////////

		try {
			//spawn process for game
			this.room.game_process = child_process.fork( path.join(__dirname, 'game_process') )
			//deprecated: child_process.fork(__dirname + '/game_process');

			let playing_users_data: UserFullData[] = [];
			this.room.forEachUser(user => {
				if( this.room.isUserSitting(user.id) )
					playing_users_data.push( user.toFullJSON() )
			});

			this.room.game_process.send({
				action: 'init_game',
				//sends array of only sitting users (actual players in game)
				playing_users: playing_users_data,
				room_info: this.room.toJSON()
			});

			(<child_process.ChildProcess>this.room.game_process).on('message', 
				this.handleGameProcessMessage.bind(this));

			(<child_process.ChildProcess>this.room.game_process).on('exit', (code, signal) => {
				console.log('Process exited with code:', code, signal);
				//TODO: handle it
			});

			//distribute game start message
			_room.forEachUser(user => {
				if(user.connection)
					user.connection.sendOnGameStartEvent(_room);
			});

			//distribute room remove to every lobby subscriber
			Connections.forEachLobbyUser(conn => conn.onRoomRemove(_room));

		}
		catch(e) {
			console.error(e);

			onGameFailedToStart(_room);
			this.onGameEnd();
		}
	}

	private onGameEnd(no_error = false) {
		if(this.room.game_process !== null)//kill process before nulling it
			this.room.game_process.kill('SIGINT');
		this.room.game_process = null;
		this.onExit(no_error);
	}

	private startGame() {
		this.game_started = true;

		try {//running game server-side
			this.room.game_process.send({
				action: 'run_game'
			});
		}
		catch(e) {
			console.error(e);
		}
	}

	private distributeData<T>(data: {[index: string]: any} & {type: NetworkCodes}) {
		this.room.forEachUser(room_user => {
			if( !room_user.connection )
				throw new Error('room_user has not assigned connection handler');

			room_user.connection.sendCustom(data);
		});
	}

	private handleGameProcessMessage(msg: GameProcessMessage) {
		switch(msg.action) {
			case NetworkCodes.START_ROUND_ACTION: {//@msg.data - game duration in seconds
				if(typeof msg.data.game_duration !== 'number' || 
					typeof msg.data.round_delay !== 'number' || 
					typeof msg.data.init_data !== 'object')
					break;

				//distribute start round message to every user in room
				this.distributeData({
					type: NetworkCodes.START_ROUND_COUNTDOWN,
					...msg.data
				});
			}	break;
			case NetworkCodes.START_GAME_FAIL_ACTION:
				onGameFailedToStart( this.room );
				this.onGameEnd();
				break;
			case NetworkCodes.END_GAME_ACTION: {
				//distribute game end message to every user in room
				this.distributeData({
					type: NetworkCodes.END_GAME,
					...msg.data
				});

				//TODO: saving game result to database
				//saveGameResult(room, msg.data.result);

				this.onGameEnd(true);
			}	break;
			case NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32: {//fast data distribution
				try {
					let buffer = Float32Array.from(msg.data);
					this.room.forEachUser(user => {
						if(user.connection)
							user.connection.sendBuffer( buffer );
					});
				} catch(e) {
					console.error('Cannot send data to client:', e);
				}
			}	break;
		}
	}

	public onConfirmation(connection: Connection) {
		if(!connection.user)
			return;
		let user_id = connection.user.id;
		this.remaining_confirmations = this.remaining_confirmations.filter(c => c !== user_id);

		if(this.remaining_confirmations.length === 0) {
			console.log('Everyone confirmed, starting game process');
			this.startGame();
		}
	}
}