import * as React from 'react';
import Network from './engine/network';
import NetworkCodes, {NetworkPackage} from '../../common/network_codes';
import {UserCustomData} from '../../common/user_info';
import RoomInfo, {RoomCustomData} from '../../common/room_info';
import HeaderNotifications from '../components/header_notifications';

//main stages
import StageBase, {BaseProps} from './stages/stage_base';
import MenuStage from './stages/menu_stage';
import GameStage from './stages/game_stage';

const TDD1 = true;//auto room joining
const TDD2 = true;//auto sit and ready

interface CoreState extends BaseProps {
	current_stage: StageBase<any, any>;
	indicate_room_deletion: boolean;
	start_game_countdown: number | null;
}

export default class extends React.Component<any, CoreState> {
	private active = false;
	private room_refresh_tm: NodeJS.Timeout | null = null;
	private room_deletion_tm: NodeJS.Timeout | null = null;

	private stageHandle: MenuStage | GameStage | null = null;

	state: CoreState = {
		current_stage: MenuStage.prototype,

		current_user: null,
		current_room: null,
		rooms_list: [],

		indicate_room_deletion: false,
		start_game_countdown: null
	}

	constructor(props: any) {
		super(props);
	}

	componentDidMount() {
		this.active = true;

		Network.assignListeners({
			onServerConnected: this.onServerConnected.bind(this),
			onServerDisconnect: this.onServerDisconnected.bind(this),
			onServerMessage: this.onServerMessage.bind(this),
			//onServerData: this.onServerData.bind(this)
		});
		Network.connect();
	}

	componentWillUnmount() {
		Network.clearListeners();
		Network.disconnect();
		this.active = false;
		if(this.room_refresh_tm)
			clearTimeout(this.room_refresh_tm);
		if(this.room_deletion_tm)
			clearTimeout(this.room_deletion_tm);
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
			this.setState({
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
					if(!this.state.current_user)//first login
						Network.requestRoomsList();
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

				case NetworkCodes.ON_ROOM_JOINED:
					if(TDD2) {
						Network.sendSitRequest();
						Network.sendReadyRequest();
					}
					this.setState({current_room: Network.getCurrentRoom(), start_game_countdown: null});
					break;
				case NetworkCodes.ON_ROOM_LEFT:
				case NetworkCodes.ON_USER_LEFT_ROOM:
				case NetworkCodes.ON_USER_JOINED_ROOM:
					this.setState({current_room: Network.getCurrentRoom()});
					break;

				case NetworkCodes.ON_ROOM_CREATED: {
					let rooms = this.state.rooms_list;
					let updated_room = RoomInfo.fromJSON(data['room']);
					if( !rooms.find(r => r.id === updated_room.id) )
						rooms.push( updated_room );
					
					if(TDD1 && !this.state.current_room)
						Network.joinRoom( updated_room.id );

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
					for(let room of this.state.rooms_list) {
						if(room.id === data['room_id']) {
							room.to_remove = true;
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

					if(TDD1 && rooms.length > 0)
						Network.joinRoom( rooms[0].id );
				}	break;

				case NetworkCodes.ON_KICKED_FROM_ROOM:
					HeaderNotifications.push(`You have been kicked from: ${data['room_name']}`);
					break;

				case NetworkCodes.ACCOUNT_ALREADY_LOGGED_IN:
					HeaderNotifications.push('Account already logged in game');
					break;

				//room_id: number, author_id: number, timestamp: number, content: string
				case NetworkCodes.ON_ROOM_MESSAGE: {
					let room = Network.getCurrentRoom();

					if(this.stageHandle && room && room.id === data['room_id']) {
						let author = room.getUserByID( data['author_id'] );
						if(author) {
							this.stageHandle.onChatMessage({
								author: author,
								timestamp: data['timestamp'],
								content: [ data['content'] ]
							});
						}
					}
				}	break;

				case NetworkCodes.GAME_COUNTDOWN_UPDATE:
					let room = Network.getCurrentRoom();
					let time = data['time'];
					if( room && room.id === data['room_id'] && (typeof time==='number' || time===null) )
						this.setState( {start_game_countdown: time} );
					break;

				case NetworkCodes.ON_GAME_START:
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
						let game = this.stageHandle.getGame();
						if(game) {
							//TODO: show results
							//GAME_STAGE.showGameResults(
							//	GameResult.fromJSON( data['result'] ).players_results );
						}
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

	render() {
		switch(this.state.current_stage) {
			default: return <div>ERROR</div>;
			case MenuStage.prototype:	
				return <MenuStage ref={el => this.stageHandle=el} {...this.state} />;
			case GameStage.prototype:
				return <GameStage ref={el => this.stageHandle=el} {...this.state} />;
		}
	}
}