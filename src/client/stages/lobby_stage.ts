///<reference path="../common/utils.ts"/>
///<reference path="../chat.ts"/>
///<reference path="../rooms_list.ts"/>
///<reference path="../room_view.ts"/>
///<reference path="../header_notifications.ts"/>
///<reference path="stage.ts"/>
///<reference path="game_stage.ts"/>
///<reference path="settings_popup.ts"/>
///<reference path="shop_popup.ts"/>
///<reference path="account_popup.ts"/>

// LOBBY_STAGE = (function() {

// const TESTING = false;

class LOBBY_STAGE extends Stage {
	private static TESTING = false;

	private chat = new Chat();
	private rooms_list = new RoomsList();
	private room_view = new RoomView();
	private notifications = new HeaderNotifications();

	constructor()  {
		super();
		console.log('LOBBY_STAGE');

		// this.chat = new Chat();
		// this.rooms_list = new RoomsList();
		// this.room_view = new RoomView();
		// this.notifications = new HeaderNotifications();

		var body_grid = $$.create('DIV').addClass('lobby_stage'),
			header = $$.create('DIV').addClass('header'),
			content_l = $$.create('DIV').addClass('content_left'),
			content_r = $$.create('DIV').addClass('content_center'),
			chat_widget = this.chat.createWidget();
		
		$$(document.body).addChild( body_grid.addChild([header, content_l, content_r, chat_widget]) );

		content_l.addChild( this.rooms_list.widget );
		content_r.addChild( this.room_view.widget );

		//header notifications
		header.addChild( this.notifications.widget );

		//account widget
		header.addChild(
			$$.create('DIV').addClass('account_short_info').setStyle({
				// 'float': 'right',
				'padding': '0px 10px',
				'borderRight': '1px solid #556c78'
			}).addChild(
				$$.create('IMG').setStyle({//TODO - user personal avatar (for registered users)
					'display': 'inline-block',
					'height': '100%',
					'width': '30px',
					'opacity': '0.5'
				}).setAttrib('src', 'img/account.png')
			).addChild(
				$$.create('DIV').addClass('account_nick').html('offline').setStyle({
					'display': 'inline-block',
					'height': 'auto',
					'padding': '0px 10px',
					'color': '#6e8f9e',
				})
			).on('click', () => {
				
				this.popup(<PopupDerived><unknown>Popup.Account);
			})
		);

		//shop button
		header.addChild(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_coin')
				//@ts-ignore //TODO
				.setStyle({margin: '0px 20px'}).on('click', () => 
					this.popup(<PopupDerived><unknown>Popup.Shop))
				.html('SHOP')
		);

		//separator
		header.addChild(
			$$.create('DIV').setStyle({
				'border-right': '1px solid rgb(85, 108, 120)',
				'height': '100%'
			})
		);

		//settings button
		header.addChild(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_settings')
				
				.setStyle({margin: '0px 20px'}).on('click', () => 
					this.popup(<PopupDerived><unknown>Popup.Settings))
				.html('SETTINGS')
		);

		//return button
		header.addChild(
			$$.create('DIV').addClass('close_btn').addClass('opacity_and_rot_transition')
				.on('click', e => {
					// location.href = './'; //TODO - try this (typescript errorfree)
					//@ts-ignore
					location = "./";//returns to home page
				})
		);

		this.refreshAccountInfo();

		super.enableBackgroundEffect();

		if(Network.getCurrentRoom() !== null) {
			this.room_view.onRoomJoined();
			this.chat.onRoomJoined();
		}

		if(Network.getCurrentUser() !== null)
			Network.subscribeLobby();

		// this.popup(<PopupDerived><unknown>Popup.Settings);
	}

	refreshAccountInfo() {
		let user = Network.getCurrentUser() || {nick: 'offline', level: '0'};

		$$('.account_short_info').getChildren('.account_nick').html( user.nick );
		$$('.account_short_info').getChildren('.account_level').html( user.level.toString() );
	}

	onServerConnected() {
		this.rooms_list.clear();
		if(Network.getCurrentUser() !== null)
			Network.subscribeLobby();
		else
			setTimeout(() => this.onServerConnected(), 300);
	}

	onServerDisconnect() {
		this.rooms_list.clear();
		this.room_view.onRoomLeft();
		this.refreshAccountInfo();
	}

	onServerMessage(data: NetworkPackage) {//JSON message
		//console.log(data, NetworkCodes);
		
		try {
			switch(data['type']) {
				case NetworkCodes.PLAYER_ACCOUNT://account info update
					this.refreshAccountInfo();
					break;
				case NetworkCodes.ACCOUNT_DATA:
					if(this.current_popup instanceof Popup.Account)
						this.current_popup.onAccountData(data['data'], data['friends']);
					this.refreshAccountInfo();
					break;
				case NetworkCodes.TRANSACTION_ERROR:
					if(this.current_popup instanceof Popup.Account)
						this.current_popup.onTransactionError(data['error_detail']);
					break;
				case NetworkCodes.SUBSCRIBE_LOBBY_CONFIRM:
					var curr_user = Network.getCurrentUser();
					if(curr_user !== null)
						curr_user.lobby_subscriber = true;
					data['rooms'].forEach((room_json: RoomCustomData) => {
						this.rooms_list.pushRoomInfo(RoomInfo.fromJSON(room_json));
					});
					if(Network.getCurrentRoom() != null)
						this.rooms_list.onRoomJoined();

					if(LOBBY_STAGE.TESTING)
						$$.runAsync(function() {//TESTING 
							Network.createRoom();
						}, 100);
					break;
				case NetworkCodes.ADD_FRIEND_CONFIRM:
					this.notifications.addNotification(
						'User has been added to your friends list');
					break;
				case NetworkCodes.REMOVE_FRIEND_CONFIRM:
					this.notifications.addNotification(
						'User has been removed from your friends list');
					Network.requestAccountData();//request updated data
					break;
				case NetworkCodes.ON_ROOM_CREATED:
					this.rooms_list.pushRoomInfo( RoomInfo.fromJSON(data['room_info']) );
					break;
				case NetworkCodes.ON_ROOM_REMOVED:
					this.rooms_list.removeRoomByID( data['room_id'] );
					break;
				case NetworkCodes.ON_ROOM_UPDATE:
					let updated_room = RoomInfo.fromJSON(data['room_info']);

					this.rooms_list.onRoomUpdate(updated_room);
					
					var curr_room = Network.getCurrentRoom();
					if(Network.getCurrentRoom() instanceof RoomInfo && curr_room !== null &&
							curr_room.id === updated_room.id) {
						this.room_view.updateRoomInfo(Network.getCurrentRoom());
					}
					break;
				case NetworkCodes.JOIN_ROOM_CONFIRM:
					this.room_view.onRoomJoined();
					this.rooms_list.onRoomJoined();
					this.chat.onRoomJoined();

					if(LOBBY_STAGE.TESTING) {
						$$.runAsync(Network.sendSitRequest, 100);
						$$.runAsync(Network.sendReadyRequest, 200);
					}
					break;
				case NetworkCodes.CHANGE_ROOM_CONFIRM:
					this.room_view.onRoomLeft();
					this.rooms_list.onRoomLeft();
					this.chat.onRoomLeft();

					this.room_view.onRoomJoined();
					this.rooms_list.onRoomJoined();
					this.chat.onRoomJoined();
					break;
				case NetworkCodes.CREATE_ROOM_CONFIRM:
					//joining created room
					Network.joinRoom( JSON.parse(data['room_info'])['id'] );
					break;
				case NetworkCodes.LEAVE_ROOM_CONFIRM:
					this.room_view.onRoomLeft();
					this.rooms_list.onRoomLeft();
					this.chat.onRoomLeft();
					break;
				case NetworkCodes.USER_JOINED_ROOM:
					this.room_view.addUser( UserInfo.fromJSON(data['user_info']) );
					break;
				case NetworkCodes.USER_LEFT_ROOM:
					this.room_view.removeUserByID( data['user_id'] );
					break;
				case NetworkCodes.ON_KICKED:
					this.room_view.onRoomLeft();
					this.rooms_list.onRoomLeft();
					this.chat.onRoomLeft();

					this.notifications.addNotification('You have been kicked from the room');
					break;
				case NetworkCodes.RECEIVE_CHAT_MESSAGE:
					this.chat.onMessage(data);
					break;
				case NetworkCodes.START_GAME_COUNTDOWN:
					this.room_view.onCountdown(data['remaining_time']);
					break;
				case NetworkCodes.START_GAME:
					this.change(<Stage><unknown>GAME_STAGE);
					break;
			}
		}
		catch(e) {
			console.log(e);
		}
	}
}

// })();