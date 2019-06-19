import * as React from 'react';

import StageBase, {BaseProps, BaseState} from './stage_base';
import {MessageSchema} from '../../components/room_chat';

// import Network from '../engine/network';
import Maps from '../../../common/game/maps';

//
import '../entities';
import ClientGame from '../client_game';
console.log(ClientGame);

interface GameState extends BaseState {

}

export default class extends StageBase<BaseProps, GameState> {
	protected game: ClientGame | null = null;//TODO - change to private or public

	state: GameState = {

	}

	constructor(props: BaseProps) {
		super(props);

		console.log('Starting game');

		let room = this.props.current_room;//Network.getCurrentRoom();
		if(room && room.map in Maps) {
			let map = Maps[room.map];
			if(!map)
				throw new Error('Map not found: ' + room.map);
			
			/*this.game = new ClientGame(map, room.gamemode, (result: boolean) => {
				if(result !== true)
					throw new Error('Cannot start the game');

				let user = this.props.current_user;

				//WHEN EVERYTHING LOADED CORRECTLY - SENDING CONFIMATION TO SERVER
				if(user && room && room.isUserSitting(user.id) )
					Network.confirmGameStart();
			});*/
		}
	}

	componentWillUnmount() {
		console.log('TODO - make sure this function invoke after game finishes');

		if(this.game)
			this.game.destroy();
	}

	public onChatMessage(msg: MessageSchema) {
		//TODO
	}

	render() {
		return <div>
			TODO
		</div>;
	}
}