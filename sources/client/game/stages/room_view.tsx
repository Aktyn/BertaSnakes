import * as React from 'react';
// import {Link} from 'react-router-dom';

// import Config from '../../../common/config';

// import Network from '../engine/network';
import RoomInfo from '../../../common/room_info';
import UserInfo from '../../../common/user_info';

// import MapsPreview, {updateMapPreview} from './maps_preview';

// import NumberInput from '../../components/number_input';
// import OptionsList from '../../components/options_list';
// import UsersList from '../../components/users_list';//TODO

// import '../../styles/room_view.scss';

/*const GAMEMODES_NAMES = [
	'Cooperation', 'Competition'
];*/

interface RoomViewProps {
	room: RoomInfo;
	current_user: UserInfo;
	//onRoomLeaveRequest: () => void;
}

interface RoomViewState {
	edit_mode: boolean;
	//gamemode_option: string;
}

export default class extends React.Component<RoomViewProps, RoomViewState> {
	// private name_input: HTMLInputElement | null = null;
	// private sits_input: NumberInput | null = null;
	// private duration_input: NumberInput | null = null;
	// private gamemode_input: OptionsList | null = null;
	// private map_input: MapsPreview | null = null;
	
	state: RoomViewState = {
		edit_mode: false,
		//gamemode_option: GAMEMODES_NAMES[this.props.room.gamemode]
	}

	constructor(props: RoomViewProps) {
		super(props);
	}

	//shouldComponentUpdate(next_props: RoomViewProps) {
		//if(next_props.room.id !== this.props.room.id && this.state.edit_mode)
		//	this.setState({edit_mode: false});
		//return true;
	//}

	componentDidUpdate() {
		/*var room_owner = this.props.room.getOwner();
		var am_i_owner = room_owner && this.props.current_user && room_owner.id === this.props.current_user.id;

		if(!am_i_owner && this.state.edit_mode)
			this.setState({edit_mode: false});*/
	}

	/*renderClockWidget(minutes: number) {
		let angle = (minutes / Config.MAXIMUM_GAME_DURATION) * 158;

		return <span className='clock_chart'>
			<svg width={100} height={100}>
				<circle r={25} cx={50} cy={50} className="stroker" style={{
					strokeDasharray: angle + ' 158'
				}}></circle>
				<circle r={35} cx={50} cy={50} className="centered"></circle>
				<text x={50} y={50} textAnchor="middle" alignmentBaseline="central">
					{minutes}&nbsp;min</text>
			</svg>
		</span>;
	}

	renderEditMode() {
		return <div className='room-view edit-mode'>
			<div className='settings-grid'>
				<label>Name:</label><input ref={el=>this.name_input=el} maxLength={256}
					type='text' defaultValue={this.props.room.name} />
				<label>Game mode:</label><OptionsList ref={el=>this.gamemode_input=el} 
					options={GAMEMODES_NAMES} onChange={opt => this.setState({gamemode_option: opt})}
					defaultValue={GAMEMODES_NAMES[this.props.room.gamemode]} />
				<label>Sits:</label><NumberInput ref={el=>this.sits_input=el} 
					defaultValue={this.props.room.sits.length} 
					min={this.state.gamemode_option === GAMEMODES_NAMES[1] ? 2 : 1} 
					max={Config.MAXIMUM_SITS} />
				<label>Duration:</label><NumberInput ref={el=>this.duration_input=el} 
					min={Config.MINIMUM_GAME_DURATION} 
					max={Config.MAXIMUM_GAME_DURATION} postfix=' min' 
					defaultValue={this.props.room.duration} />
			</div>
			<hr />
			<MapsPreview ref={el=>this.map_input=el} defaultValue={this.props.room.map} />
			<hr />
			<div>
				<button className='glossy add' style={{marginTop: '20px'}} onClick={() => {
					if(this.name_input && this.sits_input && this.duration_input && this.map_input &&
						this.gamemode_input) 
					{
						Network.sendRoomUpdateRequest(this.name_input.value, this.sits_input.value, 
							this.duration_input.value, this.map_input.value, 
							GAMEMODES_NAMES.indexOf(this.gamemode_input.value));
					}
					this.setState({edit_mode: false});
				}}>APPLY</button>
			</div>
		</div>;
	}*/

	render() {
		/*if(this.state.edit_mode)
			return this.renderEditMode();

		var room_owner = this.props.room.getOwner();
		var am_i_owner = room_owner && this.props.current_user && room_owner.id === this.props.current_user.id;

		let free_sit = this.props.room.getTakenSits() !== this.props.room.sits.length;
		let am_i_sitting = this.props.current_user ? 
			this.props.room.isUserSitting(this.props.current_user.id) : false;
		let am_i_ready = this.props.current_user ? 
			this.props.room.isUserReady(this.props.current_user.id) : false;

		return <div className='room-view'>
			<nav>
				{am_i_owner ? <button className='glossy settings' 
					onClick={() => this.setState({edit_mode: true})}>EDIT</button> : <span></span>}
				<label>{this.props.room.name}</label>
				<button className='glossy close' onClick={Network.leaveRoom}>LEAVE</button>
			</nav>
			<hr />
			<div className='room-parameters'>
				<section className='map_preview'>
					<label>{this.props.room.map}</label>
					<canvas ref={el => el && updateMapPreview(this.props.room.map, el)}
						width={150} height={150}></canvas>
				</section>
				<section className='gamemode'>{GAMEMODES_NAMES[this.props.room.gamemode]}</section>
				<section className='duration'>
					{this.renderClockWidget(this.props.room.duration)}
				</section>
			</div>
			<hr/>
			<div className='info-bar'>{
				free_sit ? 'Waiting for everyone to take a sit' : (
					this.props.room.everyoneReady() ? 
						'Everyone ready. Starting game' : 'Waiting for everyone to be ready'
				)
			}</div>
			<hr/>
			<div className='users'>
				<section className='sits'>
					<div className='actions'>
						<button className='glossy no-icon' disabled={!free_sit && !am_i_sitting}
							onClick={am_i_sitting ? Network.sendStandUpRequest:Network.sendSitRequest}>
							{am_i_sitting ? 'STAND' : 'SIT'}
						</button>
						<button className='glossy no-icon' 
							disabled={!am_i_sitting || free_sit || am_i_ready} 
							onClick={Network.sendReadyRequest}>
							READY
						</button>
					</div>
					<div className='sits-list'>
						{this.props.room.sits.map((sit, i) => {
							let user = this.props.room.getUserByID(sit);
							return <div key={i} className={this.props.room.isUserReady(sit) ? 
								'ready' : (user ? '' : 'empty')}>
								{user ? user.nick : 'EMPTY'}
							</div>;
						})}
					</div>
				</section>
				<section className='users-list-container'>
					{//<UsersList users={this.props.room.users} me={this.props.current_user} 
						am_i_owner={!!am_i_owner} />//}
				</section>
			</div>
		</div>;*/
		return <div>{this.props.room.name}</div>;
	}
}