import RoomInfo from '../../common/room_info';
import {UserFullData} from '../../common/user_info';
import NetworkCodes from '../../common/network_codes';
import Connections, {Connection} from './connections';
import {GameResultJSON} from '../../common/game/game_result';
import Database from '../database';
import {AccountSchema2UserCustomData} from '../utils';
import RoomsManager from './rooms_manager';
import * as child_process from 'child_process';
import * as path from 'path';
import {PROCESS_ACTIONS} from './game_process';

const MAX_LEVEL = 99;

async function saveGameResult(room: RoomInfo, result_json: GameResultJSON) {
	//updating user's database entries according to game result
	if(typeof result_json === 'string')
		result_json = JSON.parse(result_json);
	//console.log( room );
	//console.log( result_json );
	
	//saving game result as database result
	await Database.saveGameResult(room, result_json.players_results).catch(console.error);

	//result_json.players_results.forEach(async (result) => {
	for(let result of result_json.players_results) {
		if(!result.account_id)//ignore guests
			return;
		let account_id = result.account_id;
		
		//update account custom data
		let account_schema = await Database.getAccount(account_id);
		if( !account_schema ) {
			console.error('Account not found in database, id:', account_id);
			return;
		}
		account_schema.rank = result.rank;//rank is already updated in results
		account_schema.coins += result.coins;
		account_schema.exp += result.exp;
		account_schema.total_games += 1;
		if(account_schema.exp >= 1) { //level up
			account_schema.level = Math.min(MAX_LEVEL, account_schema.level + 1);
			account_schema.exp -= 1;
			account_schema.exp /= (account_schema.level / Math.max(1, account_schema.level-1));
		}
		
		await Database.updateAccountCustomData(account_id, account_schema);
		
		let user = room.getUserByID(result.user_id);
		if(user && user.connection && user.account_id === account_id) {
			user.connection.updateUserData( AccountSchema2UserCustomData(account_schema) );
			RoomsManager.onRoomUserCustomDataUpdate(room, user);
		}
	}
}

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
	private readonly onExit: (no_error: boolean) => void;
	private readonly room: RoomInfo;
	private remaining_confirmations: number[];
	private game_started = false;

	constructor(room: RoomInfo, onExit: (no_error: boolean) => void) {
		this.onExit = onExit;
		this.room = room;

		//prepare confirmations system
		this.remaining_confirmations = [...room.sits];

		setTimeout(() => {//after 10 seconds check if everyone confirmed game start
			if( !this.game_started ) {//if not started yet
				onGameFailedToStart(room);
				this.onGameEnd();
			}
		}, 10 * 1000);

		//////////////////////////////

		try {
			//spawn process for game
			this.room.game_process = child_process.fork( path.join(__dirname, 'game_process') );
			//deprecated: child_process.fork(__dirname + '/game_process');

			let playing_users_data: UserFullData[] = [];
			this.room.forEachUser(user => {
				if( this.room.isUserSitting(user.id) )
					playing_users_data.push( user.toFullJSON() )
			});

			this.room.game_process.send({
				action: PROCESS_ACTIONS.INIT_GAME,
				//sends array of only sitting users (actual players in game)
				playing_users: playing_users_data,
				room_info: this.room.toJSON()
			});

			(<child_process.ChildProcess>this.room.game_process).on('message', 
				this.handleGameProcessMessage.bind(this));

			(<child_process.ChildProcess>this.room.game_process).on('exit', (code, signal) => {
				if(code !== null)
					console.error('Process exited with code:', code, signal);
			});

			//distribute game start message
			room.forEachUser(user => {
				if(user.connection)
					user.connection.sendOnGameStartEvent(room);
			});

			//distribute room remove to every lobby subscriber
			Connections.forEachLobbyUser(conn => conn.onRoomRemove(room));

		}
		catch(e) {
			console.error(e);

			onGameFailedToStart(room);
			this.onGameEnd();
		}
	}

	private onGameEnd(no_error = false) {
		if(this.room.game_process !== null)//kill process before nulling it
			this.room.game_process.kill('SIGINT');
		this.room.game_process = null;
		this.room.unreadyAll();
		this.onExit(no_error);
	}

	private startGame() {
		this.game_started = true;

		try {//running game server-side
			this.room.game_process.send({
				action: PROCESS_ACTIONS.RUN_GAME
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

				//saving game result to database
				saveGameResult(this.room, msg.data.result).then(() => {
					this.onGameEnd(true);
				}).catch(console.error);
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