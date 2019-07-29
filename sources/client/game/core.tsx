import * as React from 'react';
import SwManager from '../sw_manager';
import Network from './engine/network';
import NetworkCodes, {NetworkPackage, notificationMsg} from '../../common/network_codes';
import {UserCustomData} from '../../common/user_info';
import RoomInfo, {RoomCustomData} from '../../common/room_info';
import HeaderNotifications from '../components/header_notifications';
//main stages
import StageBase, {BaseProps} from './stages/stage_base';
import MenuStage from './stages/menu_stage';
import GameStage from './stages/game_stage';

let first_load = true;

const TDD1 = false;//auto room joining
const TDD2 = false;//auto sit and ready

interface CoreState extends BaseProps {
	current_stage: StageBase<any, any>;
	indicate_room_deletion: boolean;
	start_game_countdown: number | null;
	fading: boolean;
}

// noinspection JSUnusedGlobalSymbols (it is dynamically imported in index.tsx and IDE does not handle this)
export default class extends React.Component<any, CoreState> {
	private active = false;
	private disconnect_notify = false;
	private room_id_to_join?: number;
	private room_refresh_tm: NodeJS.Timeout | null = null;
	private room_deletion_tm: NodeJS.Timeout | null = null;

	private stageHandle: MenuStage | GameStage | null = null;

	state: CoreState = {
		onChange: (target) => {
			this.setState({current_stage: target});
		},
		current_stage: MenuStage.prototype,

		current_user: null,
		current_room: null,
		rooms_list: [],

		indicate_room_deletion: false,
		start_game_countdown: null,
		
		fading: !first_load
	};

	constructor(props: any) {
		super(props);
	}

	componentDidMount() {
		this.active = true;
		first_load = false;
		
		SwManager.init().catch(console.error);

		Network.assignListeners({
			onServerConnected: this.onServerConnected.bind(this),
			onServerDisconnect: this.onServerDisconnected.bind(this),
			onServerMessage: this.onServerMessage.bind(this),
		});
		Network.connect();
	}

	componentWillUnmount() {
		Network.clearListeners();
		Network.disconnect();
		this.active = false;
		for(let timeout of [this.room_refresh_tm, this.room_deletion_tm]) {
			if(timeout)
				clearTimeout(timeout);
		}
	}
	
	componentDidUpdate(prevProps: any) {
		if( this.disconnect_notify ) {
			this.disconnect_notify = false;
			HeaderNotifications.push('Connection with server failed');
		}
		
		if(this.props.location !== prevProps.location)
			this.room_id_to_join = parseInt(this.props.match.params.room_id);
		
		if(this.room_id_to_join) {
			console.log('auto joining:', this.room_id_to_join);
			Network.joinRoom( this.room_id_to_join );
			this.room_id_to_join = undefined;
			//console.log(this.props.history);
			setTimeout(() => this.props.history.replace('/play'), 1000/60);//one frame delay
		}
	}
	
	private startRoomDeletion() {
		this.setState({indicate_room_deletion: true});

		this.room_deletion_tm = setTimeout(() => {
			this.setState({
				indicate_room_deletion: false,
				rooms_list: this.state.rooms_list.filter(r => !r.to_remove)
			});
			this.room_deletion_tm = null;
		}, 2000) as never;//must be exactly 2 seconds
	}

	onServerConnected() {
		console.log('server connected');
		Network.login();
	}

	onServerDisconnected() {
		console.log('server disconnected');
		if(this.active) {
			if( this.stageHandle instanceof GameStage )
				this.disconnect_notify = true;
			
			this.setState({
				current_stage: MenuStage.prototype,
				current_user: null,
				current_room: null,
				rooms_list: [],
				start_game_countdown: null
			});
		}
	}

	onServerMessage(data: NetworkPackage) {
		if(!this.active)
			return;
		console.log('server message:', data);

		try {
			switch(data['type']) {
				case NetworkCodes.ON_USER_DATA: {
					if(!this.state.current_user) {//first login
						Network.requestRoomsList();
						
						if(this.props.match.params.room_id !== undefined)//auto join from invitation link
							this.room_id_to_join = parseInt(this.props.match.params.room_id);
					}
					
					let updated_user = Network.getCurrentUser();
					this.setState({current_user: updated_user});

					//updating room's user data
					if(this.state.current_room && updated_user) {
						let self_user = this.state.current_room.getUserByID(updated_user.id);
						if(self_user) {
							self_user.updateData( updated_user.custom_data as UserCustomData );
							this.setState({current_room: this.state.current_room});
						}
					}
				}	break;
				case NetworkCodes.NOTIFICATION:
					HeaderNotifications.push( notificationMsg(data['code']) );
					break;

				case NetworkCodes.ON_ROOM_JOINED:
					if(TDD2) {
						Network.sendSitRequest();
						Network.sendReadyRequest();
					}
					this.setState({current_room: Network.getCurrentRoom(), start_game_countdown: null});
					break;
				case NetworkCodes.ON_USER_LEFT_ROOM:
				case NetworkCodes.ON_USER_JOINED_ROOM:
					this.setState({current_room: Network.getCurrentRoom()});
					break;

				case NetworkCodes.ON_ROOM_LEFT:
					if( this.stageHandle instanceof GameStage ) {
						this.setState({
							current_room: Network.getCurrentRoom(),
							indicate_room_deletion: false,
							rooms_list: this.state.rooms_list.filter(r => !r.to_remove),
							current_stage: MenuStage.prototype
						});
						Network.requestRoomsList();
					}
					else
						this.setState({current_room: Network.getCurrentRoom()});
					break;

				case NetworkCodes.ON_ROOM_CREATED: {
					let rooms = this.state.rooms_list;
					let updated_room = RoomInfo.fromJSON(data['room']);
					let existing_room_i = rooms.findIndex(r => r.id === updated_room.id);
					if( existing_room_i === -1 )
						rooms.push( updated_room );
					else
						rooms[existing_room_i] = updated_room;

					this.setState({rooms_list: rooms});
				}	break;

				case NetworkCodes.ON_ROOM_DATA_UPDATE: {
					let rooms = this.state.rooms_list;
					let updated_room = RoomInfo.fromJSON(data['room']);

					for(let i=0; i<rooms.length; i++) {
						if(rooms[i].id === updated_room.id) {
							rooms[i].updateData(updated_room);
							this.setState({rooms_list: rooms, start_game_countdown: null});
							break;
						}
					}

					let current_room = Network.getCurrentRoom();
					if(current_room && updated_room.id === current_room.id)
						this.setState({current_room: current_room, start_game_countdown: null});
				}	break;

				case NetworkCodes.ON_ROOM_REMOVED: {
					for(let room_rm of this.state.rooms_list) {
						if(room_rm.id === data['room_id']) {
							room_rm.to_remove = true;
							this.setState({rooms_list: this.state.rooms_list});
							break;
						}
					}
					if(!this.room_refresh_tm && !this.room_deletion_tm) {
						this.room_refresh_tm = setTimeout(() => {
							this.startRoomDeletion();
							this.room_refresh_tm = null;
						}, 3000) as never;//must be longer than 2 seconds
					}
				}	break;

				case NetworkCodes.ON_ENTIRE_LIST_ROOMS_DATA: {
					let room_datas: RoomCustomData[] = data['rooms'];
					let rooms = room_datas.map(data => RoomInfo.fromJSON(data));
					this.setState({rooms_list: rooms});

					if(TDD1)
						Network.createRoom();
				}	break;

				case NetworkCodes.ON_KICKED_FROM_ROOM:
					HeaderNotifications.push(`You have been kicked from: ${data['room_name']}`);
					break;

				case NetworkCodes.ACCOUNT_ALREADY_LOGGED_IN:
					HeaderNotifications.push('Account already logged in game');
					break;

				//room_id: number, author_id: number, timestamp: number, content: string
				case NetworkCodes.ON_ROOM_MESSAGE: {
					let room_m = Network.getCurrentRoom();

					if(this.stageHandle && room_m && room_m.id === data['room_id']) {
						let author = room_m.getUserByID( data['author_id'] );
						if(author) {
							this.stageHandle.onChatMessage({
								author: author,
								timestamp: data['timestamp'],
								content: [ data['content'] ]
							});
						}
					}
				}	break;
				case NetworkCodes.SPAM_WARNING: {
					let room_s = Network.getCurrentRoom();
					if(this.stageHandle && room_s && room_s.id === data['room_id']) {
						this.stageHandle.onSpamWarning();
					}
				}   break;

				case NetworkCodes.GAME_COUNTDOWN_UPDATE:
					let _room = Network.getCurrentRoom();
					let time = data['time'];
					if( _room && _room.id === data['room_id'] && (typeof time==='number' || time===null) )
						this.setState( {start_game_countdown: time} );
					break;

				case NetworkCodes.ON_GAME_START:
					if(this.state.current_room && data['room_id'] === this.state.current_room.id)
						this.setState({current_stage: GameStage.prototype, start_game_countdown: null});
					break;

				case NetworkCodes.ON_GAME_FAILED_TO_START:
					this.setState({
						current_stage: MenuStage.prototype,
						current_room: Network.getCurrentRoom(),
						start_game_countdown: null
					});
					Network.requestRoomsList();
					break;

				case NetworkCodes.START_ROUND_COUNTDOWN: {
					//try {
					//	$$('#waiting_indicator').delete();
					//}
					//catch(e) {}
					if( this.stageHandle instanceof GameStage ) {
						/*if( !this.stageHandle.ready ) {
							Network.leaveRoom();
							throw new Error('Game cannot start before user is ready for it');
						}*/
						let game = this.stageHandle.getGame();
						if(game) {
							game.startGame(
								data['game_duration'], data['round_delay'], data['init_data']
							);
						}
					}

				}	break;
				case NetworkCodes.END_GAME: {
					if( this.stageHandle instanceof GameStage ) {
						if(typeof data['result'] === 'object' && typeof data['result']['players_results'] === 'object'
							&& data['result']['players_results'].length > 0)
						{
							this.stageHandle.onGameEnd(data['result']['players_results']);
						}
						else
							console.error('Incorrect game results data');
					}
				}	break;

				// case NetworkCodes.ADD_FRIEND_CONFIRM:
				// 	this.HeaderNotifications.addNotification(
				// 		'User has been added to your friends list');
				// 	break;
				// case NetworkCodes.REMOVE_FRIEND_CONFIRM:
				// 	this.HeaderNotifications.addNotification(
				// 		'User has been removed from your friends list');
				// 	Network.requestAccountData();//request updated data
				// 	break;
			}
		}
		catch(e) {
			console.error(e);
		}
	}

	/*onServerData(data: Float32Array) {
		console.log('server data:', data);
	}*/
	
	renderStage() {
		switch(this.state.current_stage) {
			default: return <div>ERROR</div>;
			case MenuStage.prototype:
				return <MenuStage ref={el => this.stageHandle=el} {...this.state} />;
			case GameStage.prototype:
				return <GameStage ref={el => this.stageHandle=el} {...this.state} />;
		}
	}

	render() {
		return <>
			{this.renderStage()}
			{this.state.fading && <div className={'fade-transition'} style={{
				backgroundColor: '#5a9698'
			}} onAnimationEnd={() => this.setState({fading: false})} />}
		</>;
	}
}