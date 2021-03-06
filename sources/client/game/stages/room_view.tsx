import * as React from 'react';
import Config from '../../../common/config';

import Network from '../engine/network';
import RoomInfo from '../../../common/room_info';
import UserInfo from '../../../common/user_info';

import MapsPreview, {updateMapPreview} from './maps_preview';

import NumberInput from '../../components/widgets/number_input';
import OptionsList from '../../components/widgets/options_list';
import SlideBar from "../../components/widgets/slidebar";

import Utils from '../../utils/utils';

import '../../styles/room_view.scss'; 

//const ClockWidget: React.SFC<{seconds: number}> = (props) => {
class ClockWidget extends React.Component<{seconds: number}, any> {
	render() {
		let angle = (this.props.seconds / Config.MAXIMUM_GAME_DURATION) * 158;
		return <span className='clock_chart'>
			<svg width={100} height={100}>
				<circle r={25} cx={50} cy={50} className="stroker" style={{
					strokeDasharray: angle + ' 158'
				}}/>
				<circle r={35} cx={50} cy={50} className="centered"/>
				<text x={50} y={50} textAnchor="middle" alignmentBaseline="central">
					{(this.props.seconds / 60) | 0}&nbsp;min</text>
			</svg>
		</span>;
	}
}

interface RoomViewProps {
	room: RoomInfo;
	current_user: UserInfo;
	start_game_countdown: number | null;
	server_overload: boolean;
	unconfirmed_players: number[] | null;
}

interface RoomViewState {
	edit_mode: boolean;
	gamemode_option: string;
}

export default class extends React.Component<RoomViewProps, RoomViewState> {
	private name_input: HTMLInputElement | null = null;
	private sits_input: NumberInput | null = null;
	// private duration_input: NumberInput | null = null;
	private duration_input: SlideBar | null = null;
	private max_enemies_input: SlideBar | null = null;
	private gamemode_input: OptionsList | null = null;
	private map_input: MapsPreview | null = null;
	
	state: RoomViewState = {
		edit_mode: false,
		gamemode_option: Utils.GAMEMODES_NAMES[this.props.room.gamemode]
	};

	constructor(props: RoomViewProps) {
		super(props);
	}

	componentDidUpdate() {
		let room_owner = this.props.room.getOwner();
		let am_i_owner = room_owner && this.props.current_user && 
			room_owner.id === this.props.current_user.id;

		if(!am_i_owner && this.state.edit_mode)
			this.setState({edit_mode: false});
	}

	private renderEditMode() {
		let room_settings = this.props.room.getSettings();
		return <div className='room-view edit-mode'>
			<div key='settings' className='settings-grid'>
				<label>Name:</label>
				<input ref={el=>this.name_input=el}
					maxLength={Config.MAXIMUM_ROOM_NAME_LENGTH}
					type='text' defaultValue={room_settings.name} />
					
				<label>Game mode:</label>
				<OptionsList ref={el=>this.gamemode_input=el}
					options={Utils.GAMEMODES_NAMES} 
					onChange={opt => this.setState({gamemode_option: opt})}
					defaultValue={Utils.GAMEMODES_NAMES[room_settings.gamemode]} />
					
				<label>Sits:</label>
				<NumberInput ref={el=>this.sits_input=el}
					defaultValue={room_settings.sits_number} 
					min={this.state.gamemode_option === Utils.GAMEMODES_NAMES[1] ? 2 : 1} 
					max={Config.MAXIMUM_SITS} />
					
				<label>Duration:</label>
				<SlideBar valueSuffix={' min'} ref={el => this.duration_input=el} precision={0}
					minValue={Config.MINIMUM_GAME_DURATION/60}
					maxValue={Config.MAXIMUM_GAME_DURATION/60}
					defaultValue={(room_settings.duration/60)|0} widgetWidth={100} />
					
				<label>Maximum enemies:</label>
				<SlideBar precision={-1} minValue={10} maxValue={Config.MAXIMUM_ENEMIES_LIMIT} widgetWidth={100}
					defaultValue={room_settings.max_enemies} ref={el => this.max_enemies_input = el}/>
			</div>
			<hr key={'hr1'} />
			<MapsPreview key='maps-prev' ref={el=>this.map_input=el} defaultValue={room_settings.map} />
			<hr key={'hr2'} />
			<div key='apply-btn'>
				<button className='glossy no-icon' style={{marginBottom: '15px'}} onClick={() => {
					if(this.name_input && this.sits_input && this.duration_input && this.map_input &&
						this.gamemode_input && this.max_enemies_input)
					{
						Network.sendRoomUpdateRequest({
							name: this.name_input.value, 
							sits_number: this.sits_input.value, 
							duration: Math.round(this.duration_input.getValue())*60,
							map: this.map_input.value, 
							gamemode: Utils.GAMEMODES_NAMES.indexOf(this.gamemode_input.value),
							max_enemies: Math.round( this.max_enemies_input.getValue()/10 )*10
						});
					}
					this.setState({edit_mode: false});
				}}>APPLY</button>
			</div>
		</div>;
	}
	
	private renderInfoBar(free_sit: boolean) {
		if( free_sit )
			return <span>Waiting for everyone to take a sit</span>;
		
		if( this.props.room.everyoneReady() ) {
			return <span>Everyone ready. Starting game
				{this.props.start_game_countdown && <span> in {this.props.start_game_countdown}&nbsp;sec</span>}
			</span>;
		}
		
		if( this.props.server_overload ) {
			return <span style={{
				color: '#FFAB91',
				fontWeight: 'bold'
			}}>Server is overloaded. Too many simultaneous games. Please try again in a minute.</span>;
		}
		
		if( this.props.unconfirmed_players ) {
			return <span>Someone didn't load game in time.<br />({
				this.props.unconfirmed_players.map(id => {
					let player = this.props.room.getUserByID(id);
					return player ? player.nick : undefined;
				}).filter(nick => !!nick).join(', ')
			})</span>;
		}
		
		return <span>Waiting for everyone to be ready</span>;
	}

	render() {
		if(this.state.edit_mode)
			return this.renderEditMode();

		let room_owner = this.props.room.getOwner();
		let am_i_owner = room_owner && this.props.current_user && 
			room_owner.id === this.props.current_user.id;

		let free_sit = this.props.room.getTakenSits() !== this.props.room.sits.length;
		let am_i_sitting = this.props.current_user ? 
			this.props.room.isUserSitting(this.props.current_user.id) : false;
		let am_i_ready = this.props.current_user ? 
			this.props.room.isUserReady(this.props.current_user.id) : false;

		return <div className='room-view'>
			<nav key='navigator'>
				{am_i_owner && <button className='glossy settings edit-btn' 
					onClick={() => this.setState({edit_mode: true})}>EDIT</button>}
				<label>{Utils.trimString(this.props.room.name, 32)}</label>
				<button className='glossy close' onClick={Network.leaveRoom}>LEAVE</button>
			</nav>
			<hr key={'hr3'} />
			<section key='section1' className='room-parameters'>
				<section className='map_preview static-preview'>
					<label>{this.props.room.map}</label>
					<canvas ref={el => el && updateMapPreview(this.props.room.map, el)} width={150} height={150}/>
				</section>
				<section className='others'>
					<div>{Utils.GAMEMODES_NAMES[this.props.room.gamemode]}</div>
					<div style={{
						//fontWeight: 'normal',
						fontSize: '13px'
					}}>Maximum enemies: {this.props.room.max_enemies}</div>
				</section>
				<section className='duration'>
					<ClockWidget seconds={this.props.room.duration} />
				</section>
			</section>
			<hr key={'hr4'} />
			<section key='section2' className={`info-bar${this.props.start_game_countdown ? ' pulsing' : ''}`}>{
				this.renderInfoBar(free_sit)
			}</section>
			<hr key={'hr5'} />
			<section key='section3' className='users'>
				<div className='actions'>
					<button className='glossy no-icon' disabled={!free_sit && !am_i_sitting}
						onClick={am_i_sitting ? Network.sendStandUpRequest : Network.sendSitRequest}>
						{am_i_sitting ? 'STAND' : 'SIT'}
					</button>
					<button className='glossy no-icon' 
						disabled={!am_i_sitting || free_sit || am_i_ready} 
						onClick={Network.sendReadyRequest}>READY</button>
				</div>
				<div className='sits-list'>
					{this.props.room.sits.map((sit, i) => {
						let user = this.props.room.getUserByID(sit);
						return <div key={i} className={this.props.room.isUserReady(sit) ? 
							'ready' : (user ? '' : 'empty')}>
							{user ? <>
								{Utils.trimString(user.nick, 15)}
								<img src={Utils.SHIP_TEXTURES[user.custom_data.ship_type]} alt='ship icon' />
							</> : 'EMPTY'}
						</div>;
					})}
				</div>
			</section>
		</div>;
	}
}