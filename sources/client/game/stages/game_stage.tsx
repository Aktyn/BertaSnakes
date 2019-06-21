import * as React from 'react';

import StageBase, {BaseProps, BaseState} from './stage_base';
import UserBtn from '../../components/user_btn';
import {MessageSchema} from '../../components/room_chat';

import Network from '../engine/network';
import Maps from '../../../common/game/maps';

import {prepareEntities} from '../entities';
import ClientGame from '../client_game';

import './../../styles/game_stage.scss';

interface GameState extends BaseState {
	hide_rightside: boolean;
}

export default class extends StageBase<BaseProps, GameState> {
	private game: ClientGame | null = null;//TODO - change to private or public

	state: GameState = {
		hide_rightside: false,
	}

	constructor(props: BaseProps) {
		super(props);
	}

	componentDidMount() {
		console.log('Starting game');

		let room = this.props.current_room;//Network.getCurrentRoom();
		if(room && room.map in Maps) {
			let map = Maps[room.map];
			if(!map)
				throw new Error('Map not found: ' + room.map);
			
			prepareEntities();
			this.game = new ClientGame(map, room.gamemode, (result: boolean) => {
				if(result !== true)
					throw new Error('Cannot start the game');

				let user = this.props.current_user;

				//WHEN EVERYTHING LOADED CORRECTLY - SENDING CONFIMATION TO SERVER
				if(user && room && room.isUserSitting(user.id) ) {
					//disable for testing game start failure
					Network.confirmGameStart();
				}
			});
		}
	}

	componentWillUnmount() {
		console.log('TODO - make sure this function invoke after game finishes');

		if(this.game)
			this.game.destroy();
	}

	public getGame() {
		return this.game;
	}

	public onChatMessage(msg: MessageSchema) {
		//TODO
	}

	render() {
		return <div className='game-stage'>
			<div className='left-panel'>TODO: left panel</div>
			<div className='skillsbar-container'>
				<div className='skillsbar'>TODO: skillsbar</div>
			</div>
			<div className={`right-panel${this.state.hide_rightside ? ' hidden' : ''}`}>
				<nav>
					<button className='slide-toggler' onClick={() =>
						this.setState({hide_rightside: !this.state.hide_rightside})}></button>
					<UserBtn user={this.props.current_user} />
				</nav>
				<button>LEAVE WITH CONFIRMATION</button>
				<div>TODO - list of users</div>
			</div>
			<div className='chat-container'>
				TODO - force chat display when rightside panel is visible
			</div>
		</div>;
	}
}