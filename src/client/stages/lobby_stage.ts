///<reference path="../common/utils.ts"/>
///<reference path="../chat.ts"/>
///<reference path="../rooms_list.ts"/>
///<reference path="../room_view.ts"/>
///<reference path="../header_notifications.ts"/>
///<reference path="../engine/device.ts"/>
///<reference path="stage.ts"/>
///<reference path="game_stage.ts"/>
///<reference path="settings_popup.ts"/>
///<reference path="shop_popup.ts"/>
///<reference path="account_popup.ts"/>

// LOBBY_STAGE = (function() {

// const TESTING = false;
namespace Stages {
	export class LOBBY_STAGE extends Stages.StageBase {
		private static TESTING = false;

		private chat = new Chat();
		private rooms_list = new RoomsList();
		private room_view = new Components.RoomView();
		private notifications = new HeaderNotifications();

		private orientation_request: $_face | null = null;
		private explicity_nope = false;
		private onScreenOrientationChange?: (cb: number) => void;

		constructor()  {
			super();
			console.log('LOBBY_STAGE');

			var body_grid = $$.create('TABLE').addClass('lobby_stage'),
				header = $$.create('TD').addClass('header').setAttrib('colspan', 2),
				header_row = $$.create('TR').addChild(header),
				content = $$.create('TR').addClass('content'),
				//content_l = $$.create('DIV').addClass('content_left'),
				content_r = $$.create('TD').addClass('content_center'),//room view
				//chat_widget = this.chat.createWidget(),
				chat_holder = $$.create('TD').setStyle({
					'padding': '0px',
					'vertical-align': 'bottom',
				    'width': '0.1%',
	    			'min-width': '250px'
				}).addChild( this.chat.chat_widget ).addClass('chat_cell');

			content.addChild(content_r);
			content.addChild(chat_holder);
			
			$$(document.body).addChild([
				this.rooms_list.widget,
				this.rooms_list.switcher_widget,
				//fold_widget,
				body_grid.addChild([header_row, content])
			]);

			//content_l.addChild( this.rooms_list.widget );
			//console.log(this.room_view.widget);
			try {
				content_r.addChild( this.room_view.widget );
			} catch(e) {}

			//header notifications
			header.addChild( this.notifications.widget );

			//account widget
			header.addChild(
				$$.create('DIV').addClass('account_short_info').setStyle({
					'padding': '0px 10px',
					'borderRight': '1px solid #fff4'//#556c78
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
					let user = Network.getCurrentUser();
					if(user && user.id > 0)
						this.popup(Popup.Account);
				})
			);

			//shop button
			header.addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_coin')
					.setStyle({'margin': '0px 20px'}).on('click', () => 
						this.popup(Popup.Shop))
					.html('SHOP').setAttrib('id', 'shop_button')
			);

			//separator
			header.addChild(
				$$.create('DIV').setStyle({
					'border-right': '1px solid #fff4',//rgb(85, 108, 120)
					// 'height': '100%'
					'height': '50px'
				})
			);

			//settings button
			header.addChild(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_settings')
					.setStyle({'margin': '0px 20px'}).on('click', () => 
						this.popup(Popup.SettingsPop))
					.html('SETTINGS')
			);

			//return button
			header.addChild(
				$$.create('DIV').addClass('close_btn').addClass('opacity_and_rot_transition')
					.on('click', e => {
						location.href = './';
						//location = "./";//returns to home page (typescript shows error)
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

			this.checkDevice();
		}

		destroy() {
			if(this.onScreenOrientationChange)
				Device.onOrientationChangeRelease( this.onScreenOrientationChange );

			super.destroy();
		}

		private showOrientationRequest() {
			if(this.explicity_nope === true)
				return;
			var device_image = $$.create('IMG').setAttrib('src', 'img/device.svg')
				.addClass('phone_image');

			this.orientation_request = $$.create('DIV').addClass('popup_container').addChild(
				$$.create('DIV').addClass('popup').setStyle({
					'display': 'inline-block'
				}).addChild(//text
					$$.create('DIV').setStyle({
						'min-width': '300px',
						'max-width': '100vw',
						'font-size': '25px',
						'padding': '15px'
					}).setText('You should turn your device horizontally for better experience')
				).addChild(//device animation
					$$.create('DIV').addChild(device_image)
				).addChild(//option buttons
					$$.create('DIV').addChild(
						$$.create('BUTTON').addClass('nope_btn').setText('NOPE').on('click', () => {
							this.explicity_nope = true;
							if(this.orientation_request)
								this.orientation_request.delete();
						})
					)
				)
			).addClass('orientation_request');

			$$(document.body).addChild(this.orientation_request);
		}

		private checkDevice() {
			if(Device.info.orientation === Device.Orientation.PORTRAIT) {
				this.showOrientationRequest();
			}

			this.onScreenOrientationChange = (orient) => {
				if(orient === Device.Orientation.LANDSCAPE && this.orientation_request) {
					this.orientation_request.delete();
					this.orientation_request = null;
				}
				else
					this.showOrientationRequest();
			};

			Device.onOrientationChange( this.onScreenOrientationChange );
		}

		refreshAccountInfo() {
			let user = Network.getCurrentUser() || {nick: 'offline', level: '0', id: -1};

			$$('.account_short_info').getChildren('.account_nick').html( user.nick );
			//$$('.account_short_info').getChildren('.account_level').html( user.level.toString() );
			if(user.id < 0) {
				$$('#shop_button').setAttrib('disabled', 'true');
				//element created in room_view.ts
				$$('#warning_for_guest').setStyle({'display': 'block'});
				$$('.account_short_info').addClass('disabled');
			}
			else {
				$$('#shop_button').removeAttrib('disabled');
				//element created in room_view.ts
				$$('#warning_for_guest').setStyle({'display': 'none'});
				$$('.account_short_info').removeClass('disabled');
			}
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
					case NetworkCodes.ACCOUNT_ALREADY_LOGGED_IN:
						this.notifications.addNotification('Your account is already logged in game.');
						this.notifications.addNotification('Check other browser tabs.');
						break;
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
						this.change(GAME_STAGE);
						break;
				}
			}
			catch(e) {
				console.log(e);
			}
		}
	}
}