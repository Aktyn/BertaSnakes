import * as React from 'react';

import Network from './engine/network';
import NetworkCodes, {NetworkPackage} from './../../common/network_codes';
//import UserInfo from './../../common/user_info';
import RoomInfo, {RoomCustomData} from './../../common/room_info';

//main stages
import StageBase, {BaseProps} from './stages/stage_base';
import MenuStage from './stages/menu_stage';
import GameStage from './stages/game_stage';

//popups
import {PopupContext} from './stages/popups/popup_base';
import UserProfile, {UserProfileProps,} from './stages/popups/user_profile';

const TDD = true;

interface CoreState extends BaseProps {
	current_stage: StageBase<any, any>;//changed from any to StageBase<any, any>
	current_popup?: any;
	popup_props?: UserProfileProps;
}

export default class extends React.Component<any, CoreState> {
	private currentStage: StageBase<any, any> | null = null;
	private active = false;

	state: CoreState = {
		current_stage: MenuStage.prototype,
		current_popup: undefined,

		account: null,
		room: null,
		rooms_list: [],

		openPopupStage: this.openPopupStage.bind(this)
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
			onServerData: this.onServerData.bind(this)
		});
		Network.connect();

		/*if(Network.getCurrentRoom() !== null) {
			this.room_view.onRoomJoined();
			this.chat.onRoomJoined();
		}*/
	}

	componentWillUnmount() {
		this.active = false;
	}

	openPopupStage(_popup_class: any, _popup_props?: UserProfileProps) {
		if(this.state.current_popup)//there must not be a popup open
			return;
		this.setState({current_popup: _popup_class, popup_props: _popup_props});
	}

	notify(...msg: string[]) {
		if(this.currentStage && this.currentStage.notifications)
			this.currentStage.notifications.add(...msg);
	}

	onServerConnected() {
		console.log('server connected');
	}

	onServerDisconnected() {
		console.log('server disconnected');
		if(this.active) {
			this.setState({account: null, room: null, rooms_list: []});
			//TODO - open info about server connection lost with reconnect button
		}
	}

	onServerMessage(data: NetworkPackage) {
		if(!this.active)
			return;
		console.log('server message:', data);

		try {
			switch(data['type']) {
				case NetworkCodes.ACCOUNT_ALREADY_LOGGED_IN:
					this.notify('Your account is already logged in game.',
						'Check other browser tabs.');
					break;
				case NetworkCodes.PLAYER_ACCOUNT: {
					this.setState({account: Network.getCurrentUser()});

					let user = Network.getCurrentUser();
					if(user && user.lobby_subscriber === false) {
						Network.subscribeLobby();
					}

					/*if(TDD) {
						this.openPopupStage(UserProfile.prototype, {user: Network.getCurrentUser()} as 
							UserProfileProps);
					}*/
				}	break;
				case NetworkCodes.ACCOUNT_DATA:
					this.setState({account: Network.getCurrentUser()});
					break;
				/*case NetworkCodes.TRANSACTION_ERROR:
					if(this.current_popup instanceof Popup.Account)
						this.current_popup.onTransactionError(data['error_detail']);
					break;*/
				case NetworkCodes.SUBSCRIBE_LOBBY_CONFIRM: {
					var curr_user = Network.getCurrentUser();
					if(curr_user !== null)
						curr_user.lobby_subscriber = true;

					let _rooms_list: RoomInfo[] = [];
					data['rooms'].forEach((room_json: RoomCustomData) => {
						//rooms_list.pushRoomInfo(RoomInfo.fromJSON(room_json));
						_rooms_list.push( RoomInfo.fromJSON(room_json) );
					});
					this.setState({rooms_list: _rooms_list});
					//if(Network.getCurrentRoom() != null)
					//	rooms_list.onRoomJoined();

					if(TDD) {
						Network.joinRoom(this.state.rooms_list[0].id);
					}
				}	break;
				/*case NetworkCodes.ADD_FRIEND_CONFIRM:
					this.notifications.addNotification(
						'User has been added to your friends list');
					break;
				case NetworkCodes.REMOVE_FRIEND_CONFIRM:
					this.notifications.addNotification(
						'User has been removed from your friends list');
					Network.requestAccountData();//request updated data
					break;*/
				case NetworkCodes.ON_ROOM_CREATED: {
					//this.rooms_list.pushRoomInfo( RoomInfo.fromJSON(data['room_info']) );
					let _rooms_list = this.state.rooms_list;
					_rooms_list.push( RoomInfo.fromJSON(data['room_info']) );
					this.setState({rooms_list: _rooms_list});
				}	break;
				case NetworkCodes.ON_ROOM_REMOVED:
					this.setState({
						rooms_list: this.state.rooms_list.filter(r => r.id !== data['room_id'])
					});
					//this.rooms_list.removeRoomByID( data['room_id'] );
					break;
				case NetworkCodes.ON_ROOM_UPDATE: {
					let updated_room = RoomInfo.fromJSON(data['room_info']);

					let _rooms_list = this.state.rooms_list;
					for(var room of _rooms_list) {
						if(room.id === updated_room.id) {
							room.updateData(updated_room);
							break;
						}
					}
					if(this.active)
						this.setState({rooms_list: _rooms_list, room: Network.getCurrentRoom()});
				}	break;
				case NetworkCodes.JOIN_ROOM_CONFIRM:
				case NetworkCodes.CHANGE_ROOM_CONFIRM:
					this.setState({room: Network.getCurrentRoom()});
					break;
				case NetworkCodes.CREATE_ROOM_CONFIRM:
					//joining created room
					Network.joinRoom( JSON.parse(data['room_info'])['id'] );
					break;
				case NetworkCodes.LEAVE_ROOM_CONFIRM:
					this.setState({room: null});
					break;
				case NetworkCodes.USER_JOINED_ROOM:
					//this.room_view.addUser( UserInfo.fromJSON(data['user_info']) );
					this.setState({room: Network.getCurrentRoom()});
					break;
				case NetworkCodes.USER_LEFT_ROOM:
					//this.room_view.removeUserByID( data['user_id'] );
					this.setState({room: Network.getCurrentRoom()});
					break;
				case NetworkCodes.ON_KICKED:
					this.setState({room: Network.getCurrentRoom()});

					this.notify('You have been kicked from the room');
					break;
				case NetworkCodes.RECEIVE_CHAT_MESSAGE:
					if(this.currentStage) {
						this.currentStage.onChatMessage(
							data['from'], data['public'], data['id'], data['msg']);
					}
					//this.chat.onMessage(data);
					break;
				/*case NetworkCodes.START_GAME_COUNTDOWN:
					this.room_view.onCountdown(data['remaining_time']);
					break;
				case NetworkCodes.START_GAME:
					this.change(GAME_STAGE);
					break;*/
			}
		}
		catch(e) {
			console.error(e);
		}
	}

	onServerData(data: Float32Array) {
		console.log('server data', data);
	}

	render() {
		return <React.Fragment>
			{(() => {
				switch(this.state.current_stage) {
					default: return <div>ERROR</div>;
					case MenuStage.prototype:	return <MenuStage ref={el=>this.currentStage=el} 
						{...this.state} />;
					case GameStage.prototype:	return <GameStage ref={el=>this.currentStage=el} 
						{...this.state} />;
				}
			})()}
			<PopupContext.Provider value={{
				onClose: () => this.setState({current_popup: undefined})
			}}>
			{this.state.current_popup && (() => {
				switch(this.state.current_popup) {
					default: return <div>ERROR</div>;
					case UserProfile.prototype:	return (this.state.popup_props && 
						<UserProfile {...this.state.popup_props} />
					);
				}
			})()}
			</PopupContext.Provider>
		</React.Fragment>;
	}
}