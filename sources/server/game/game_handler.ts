import RoomInfo from '../../common/room_info';
import Connections, {Connection} from './connections';
// import * as child_process from 'child_process';
// import * as path from 'path';

export default class GameHandler {
	private onExit: () => void;
	//private room: RoomInfo;
	private remaining_confirmations: number[];

	constructor(_room: RoomInfo, _onExit: () => void) {
		this.onExit = _onExit;
		//this.room = _room;

		//TODO - prepare confirmations system
		this.remaining_confirmations = [..._room.sits];

		try {

			//distribute game start message
			_room.forEachUser(user => {
				if(user.connection)
					user.connection.sendOnGameStartEvent(_room);
			});

			//spawn process for game
			//room.game_process = child_process.fork( path.join(__dirname, 'game_process') )
			//deprecated: child_process.fork(__dirname + '/game_process');

			//distribute room remove to every lobby subscriber
			Connections.forEachLobbyUser(conn => conn.onRoomRemove(_room));

		}
		catch(e) {
			console.error(e);

			_room.forEachUser(user => {
				if(user.connection)
					user.connection.sendGameStartFailure(_room);
			});

			this.onGameEnd();
		}
	}

	private onGameEnd() {
		//TODO - kill process
		// this.room.game_process = null;
		this.onExit();
	}

	public onConfirmation(connection: Connection) {
		if(!connection.user)
			return;
		let user_id = connection.user.id;
		this.remaining_confirmations = this.remaining_confirmations.filter(c => c !== user_id);

		if(this.remaining_confirmations.length === 0) {
			console.log('Everyone confirmed');
		}
	}
}