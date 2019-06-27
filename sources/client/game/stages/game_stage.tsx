import * as React from 'react';

import StageBase, {BaseProps, BaseState} from './stage_base';
import MenuStage from './menu_stage';

import Network from '../engine/network';
import Maps from '../../../common/game/maps';
import RoomInfo from '../../../common/room_info';

import {prepareEntities} from '../entities';
import ClientGame, {ListenersSchema, InitDataSchema} from '../client_game';
import Entities from '../entities';
import Assets from '../engine/assets';
import Player from '../../../common/game/objects/player';
import Colors from '../../../common/game/common/colors';
import {PlayerResultJSON} from '../../../common/game/game_result';

import GameResults from '../../components/game_results';
import UsersList from '../../components/users_list';
import UserBtn from '../../components/user_btn';
import RoomChat from '../../components/room_chat';
import SkillsBar from '../../components/skills_bar';
import {MessageSchema} from '../../components/room_chat';

import Utils from '../../utils/utils';

import './../../styles/game_stage.scss';

const BAR_COLORS = ['#8BC34A', '#42A5F5', '#ef5350'];
let notifications_counter = 0;

interface PlayerInfo extends InitDataSchema {
	health: number;
	energy: number;
	kills: number;
	deaths: number;
	points: number;
	ship_texture?: string;
}

interface GameState extends BaseState {
	hide_rightside: boolean;
	hide_chat: boolean;

	hp_value: number;
	energy_value: number;
	speed_value: number;

	am_i_playing: boolean;
	players_infos: PlayerInfo[];
	notifications: {id: number, content: string}[];
	
	results?: PlayerResultJSON[];
}

export default class extends StageBase<BaseProps, GameState> {
	private game: ClientGame | null = null;//TODO - change to private or public

	private chatHandle: RoomChat | null = null;
	private skillsbar: SkillsBar | null = null;

	private chat_toggler: HTMLButtonElement | null = null;
	private right_panel_toggler: HTMLButtonElement | null = null;
	private exit_btn: HTMLButtonElement | null = null;
	//@ts-ignore TODO: use this
	private timer: HTMLSpanElement | null = null;

	private exit_confirmation: NodeJS.Timeout | null = null;

	private speed_update_filter = 0;

	//public ready = false;
	private mounted = false;

	state: GameState = {
		hide_rightside: false,//TODO: get from settings
		hide_chat: true,

		hp_value: 1,
		energy_value: 1,
		speed_value: 0,

		am_i_playing: false,
		players_infos: [],
		notifications: []
	};

	constructor(props: BaseProps) {
		super(props);
	}

	componentDidMount() {
		console.log('Starting game');
		this.mounted = true;

		let room = this.props.current_room;//Network.getCurrentRoom();
		if(room && room.map in Maps) {
			let map = Maps[room.map];
			if(!map)
				throw new Error('Map not found: ' + room.map);
			
			prepareEntities();
			this.game = new ClientGame(map, room.gamemode, this.initListeners(), (result: boolean) => {
				if(result !== true)
					throw new Error('Cannot start the game');

				let user = this.props.current_user;

				//WHEN EVERYTHING LOADED CORRECTLY - SENDING CONFIRMATION TO SERVER
				if(user && room && room.isUserSitting(user.id) ) {
					//disable for testing game start failure
					Network.confirmGameStart();
					//this.ready = true;
				}
			});
		}
	}

	componentWillUnmount() {
		this.mounted = false;
		if(this.game)
			this.game.destroy();
		if(this.exit_confirmation)
			clearTimeout(this.exit_confirmation);
		//this.ready = false;
	}

	private initListeners(): ListenersSchema {
		return {
			onInitData: this.setPlayersData.bind(this),
			onTimerUpdate: (time) => {
				if(this.timer) {
					this.timer.innerText = Utils.secondsToTime(time, ' ', {
						hours: 'h',
						minutes: 'm', 
						seconds: 's'
					});
				}
			},
			onNotification: (content) => {
				let new_notifications = this.state.notifications;
				new_notifications.push({id: notifications_counter++, content});
				this.setState({notifications: new_notifications});

				setTimeout(() => {//remove oldest notification
					if( !this.mounted )
						return;
					let notifs = this.state.notifications;
					notifs.shift();
					this.setState({notifications: notifs});
				}, 5000);
			},

			onPlayerSpeedChange: (value) => {//NOTE - only current player speed is visible
				if(20 <= ++this.speed_update_filter)
					this.speed_update_filter = 0;
				if(value === this.state.speed_value || this.speed_update_filter%20 !== 0)
					return;//no need for unnecessary state updates
				this.setState({speed_value: Math.max(0, Math.min(1, value))});
			},

			onPlayerHpChange: (index, value) => {
				this.state.players_infos[index].health = value;

				if( this.props.current_user && this.props.current_user.id === 
					this.state.players_infos[index].id )
				{
					this.setState({
						players_infos: this.state.players_infos,
						hp_value: value
					});
				}
				else
					this.setState({players_infos: this.state.players_infos});
			},
			onPlayerEnergyChange: (index, value) => {
				this.state.players_infos[index].energy = value;

				if( this.props.current_user && this.props.current_user.id === 
					this.state.players_infos[index].id )
				{
					this.setState({
						players_infos: this.state.players_infos,
						energy_value: value
					});
				}
				else
					this.setState({players_infos: this.state.players_infos});
			},
			onPlayerPointsChange: (index, value) => {
				this.state.players_infos[index].points = value;
				this.setState({players_infos: this.state.players_infos});
			},
			onPlayerKill: (index: number) => {
				this.state.players_infos[index].kills++;
				this.setState({players_infos: this.state.players_infos});
			},
			onPlayerDeath: (index: number) => {
				this.state.players_infos[index].deaths++;
				this.setState({players_infos: this.state.players_infos});
			},

			addChildEmptySkill: (slot_index) => {
				if(this.skillsbar)
					this.skillsbar.addEmptySkill(slot_index);
			},
			addChildSkill: (texture_name, key, continous) => {
				if(this.skillsbar)
					this.skillsbar.addSkill(texture_name, key, continous);
			},

			onSkillUsed: (index, cooldown) => {
				if(this.skillsbar)
					this.skillsbar.useSkill(index, cooldown);
			},

			onSkillStopped: (index) => {
				if(this.skillsbar)
					this.skillsbar.stopSkill(index);
			}
		}
	}

	private setPlayersData(init_data: InitDataSchema[]) {
		let am_i_playing = false;
		//console.log(init_data);
		let infos = init_data.map(data => {
			let player_entity = Player.entityName(data.ship_type, Colors.PLAYERS_COLORS[data.color_id]);
			
			let texture: HTMLCanvasElement | HTMLImageElement | undefined = undefined;
			if( Assets.loaded() ) {
				let entity = Entities.getEntity(player_entity);
				if(entity)
					texture = Assets.getTexture( entity.texture_name );
			}

			if( this.props.current_user && this.props.current_user.id === data.id )
				am_i_playing = true;

			let source = undefined;
			if(texture) {
				if(texture instanceof HTMLCanvasElement)
					source = texture.toDataURL();
				else if(texture instanceof HTMLImageElement)
					source = texture.src;
			}

			return {
				health: 1,
				energy: 1,
				kills: 0,
				deaths: 0,
				points: 0,
				ship_texture: source,
				...data
			} as PlayerInfo;
		});

		this.setState({players_infos: infos, am_i_playing});
	}

	public getGame() {
		return this.game;
	}
	
	public onGameEnd(players_results: PlayerResultJSON[]) {
		//console.log(players_results);
		this.setState(({results: players_results}));
		
		if(this.game)
			this.game.end();
	}

	// noinspection JSUnusedGlobalSymbols
	public onChatMessage(msg: MessageSchema) {
		if(this.chatHandle)
			this.chatHandle.pushMessage(msg);
	}

	private tryLeave() {
		if(!this.exit_btn)
			return;
		if( !this.exit_confirmation ) {
			this.exit_btn.innerText = 'YOU SURE?';
			this.exit_btn.blur();
			this.exit_confirmation = setTimeout(() => {
				if(this.exit_btn) {
					this.exit_btn.innerText = 'EXIT GAME';
					this.exit_btn.blur();
				}
				this.exit_confirmation = null;
			}, 5000) as never;
		}
		else {
			Network.leaveRoom();
		}
	}

	private renderBars() {
		return [this.state.hp_value, this.state.energy_value, this.state.speed_value].map(
			(value, index) => {
				let percent = Math.max(0, (value*100)|0) + '%';
				return <div key={index} className='value-bar' style={{
					width: percent,
					backgroundColor: BAR_COLORS[index]
				}}>{percent}</div>;
			});
	}

	private renderRoomInfo() {
		if(!this.props.current_room)
			return 'ERROR: room data not found';
		return <table><tbody>
			<tr>
				<td>Room:</td>
				<td>{Utils.trimString(this.props.current_room.name, 15)}</td>
			</tr>
			<tr><td>Map:</td><td>{this.props.current_room.map}</td></tr>
			<tr><td>Mode:</td><td>{Utils.GAMEMODES_NAMES[this.props.current_room.gamemode]}</td></tr>
			<tr><td>Time:</td><td><span ref={el => this.timer = el}>---</span></td></tr>
		</tbody></table>;
	}

	private renderPlayersStats(room: RoomInfo) {
		return this.state.players_infos.map((info) => {
			let user = room.getUserByID(info.id);
			let hp_percent = Math.floor(info.health*100) + '%';
			let energy_percent = Math.floor(info.energy*100) + '%';
			
			return <section key={info.id} className={`player-info${user ? '' : ' offline'}`}>
				<div className='player-info-grid'>
					<label>{Utils.trimString(info.nick, 15)}</label>
					<span className='points'>{info.points}</span>
					<span className='player'>
						<img src={info.ship_texture}  alt='ship type preview'/>
						<span style={{backgroundColor: Colors.PLAYERS_COLORS[info.color_id].hex}}/>
					</span>
					<span className='kills'>{info.kills}</span>
					<span className='deaths'>{info.deaths}</span>
				</div>
				<div className='small-bars'>
					<div style={{width: hp_percent, backgroundColor: BAR_COLORS[0]}}/>
					<div style={{width: energy_percent, backgroundColor: BAR_COLORS[1]}}/>
				</div>
			</section>;
		});
	}

	render() {
		if( this.state.results && this.props.current_room )
			return <GameResults data={this.state.results} room={this.props.current_room}
			                    onClose={() => {
			                        this.props.onChange(MenuStage.prototype);
			                        Network.requestRoomsList();
			                    }} />;
		return <div className='game-stage'>
			<div className='left-panel'>
				{this.state.am_i_playing && <section className='bars'>{this.renderBars()}</section>}
				<section>{this.renderRoomInfo()}</section>
				{this.props.current_room && this.renderPlayersStats(this.props.current_room)}

				<div className='notifications-container'>{this.state.notifications.map(notification => {
					return <div key={notification.id}>{notification.content}</div>;
				})}</div>
			</div>
			<div className='skillsbar-container'>
				<SkillsBar ref={el => this.skillsbar = el} onEmoticonUse={index => {
					if(this.game)
						this.game.tryEmoticonUse(index);
				}} onSkillUse={index => {
					if(this.game)
						this.game.trySkillUse(index);
				}} onSkillStop={index => {
					if(this.game)
						this.game.trySkillStop(index);
				}} />
			</div>
			<div className={`right-panel${this.state.hide_rightside ? ' hidden' : ''}`}>
				<nav>
					<button className='slide-toggler' onClick={() => {
						if (this.right_panel_toggler)
							this.right_panel_toggler.blur();
						this.setState({hide_rightside: !this.state.hide_rightside});
					}} ref={el => this.right_panel_toggler = el}/>
					<UserBtn user={this.props.current_user} />
				</nav>
				<button className='glossy no-icon exit-btn' ref={el => this.exit_btn = el} 
					onClick={this.tryLeave.bind(this)} style={{margin: '10px 0px'}}>EXIT GAME</button>
				<div className='list-stretcher'>{this.props.current_room &&
					<UsersList disable_players_kicking={true}
					           current_user={this.props.current_user} room={this.props.current_room} />
				}</div>
			</div>
			<div className={`chat-container${this.state.hide_chat && this.state.hide_rightside ? 
				' hidden' : ''}`}>
				<div className='chat-body'>
					<button className={`chat-toggler${this.state.hide_rightside ? '' : ' disabled'}`} 
						onClick={() => {
							if(this.chat_toggler)
								this.chat_toggler.blur();
							this.setState({hide_chat: !this.state.hide_chat});
						}} ref={el => this.chat_toggler = el}>{
							this.state.hide_chat && this.state.hide_rightside ? 'SHOW' : 'HIDE'
						}</button>
					<RoomChat current_user={this.props.current_user} ref={el => this.chatHandle = el} />
				</div>
			</div>
		</div>;
	}
}