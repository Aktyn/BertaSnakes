const RoomsList = (function() {

	return class extends SessionWidget {
		constructor() {
			super();
			//this.rooms = [];//used for updating existing rooms infos
		}

		get listWidget() {
			return $$('#rooms_list' + this.session_string + this.id) || $$(document.body);
		}

		clear() {
			//this.rooms = [];
			this.listWidget.getChildren('.html_list').html('');
		}

		onRoomJoined() {
			try {
				this.listWidget.getChildren("#room_list_entry_" + Network.getCurrentRoom().id)
					.addClass('current_room');
			}
			catch(e) {
				console.error(e);
			}
		}

		onRoomLeft() {
			this.listWidget.getChildren('.html_list').getChildren('*').removeClass('current_room');
		}

		onRoomUpdate(room) {
			$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');

			try {
				let room_row = this.listWidget.getChildren("#room_list_entry_" + room.id);
				room_row.getChildren('.room_sits_info')
					.setText(room.taken_sits + '/' + room.sits.length);
				room_row.getChildren('.room_name_info').setText( COMMON.trimString(room.name, 10) )
					.attribute('name', room.name);//atribute contains full name
				room_row.getChildren('.room_map_info').setText( room.map );
				room_row.getChildren('.room_mode_info').setText(
					room.gamemode === RoomInfo.GAME_MODES.COOPERATION ? 'Coop' : 'Comp' );
				room_row.getChildren('.room_duration_info')
					.setText( ((room.duration / 60)|0) + ' min' );
			}
			catch(e) {
				console.error(e);
			}
		}

		pushRoomInfo(room) {
			$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');

			var entry = $$.create('DIV').attribute('id', 'room_list_entry_' + room.id)
				.append( $$.create('SPAN').setText( COMMON.trimString(room.name, 10) )
					.addClass('room_name_info').attribute('name', room.name)
					.setStyle({gridColumn: '1', textAlign: 'left'}) )
				.append( $$.create('SPAN').addClass('room_sits_info')
					.setText(room.taken_sits + '/' + room.sits.length)
					.setStyle({gridColumn: '2'}) )
				.append( $$.create('SPAN').addClass('room_duration_info')
					.setText( ((room.duration / 60)|0) + ' min' ) )
				.append( $$.create('SPAN').addClass('room_map_info')
					.setText( room.map ) )
				.append( $$.create('SPAN').addClass('room_mode_info')
					.setText( room.gamemode === RoomInfo.GAME_MODES.COOPERATION ? 'Coop' : 'Comp' ) )
				.on('click', (e) => {
					Network.joinRoom(room.id);
				});
				//.append( $$.create('SPAN').html('USERS - todo').setStyle({gridColumn: '3'}) );
			this.listWidget.getChildren('.html_list').append(entry);
			this.listWidget.getChildren('H1').html('Avaible rooms');
		}

		removeRoomByID(room_id) {
			$$.assert(typeof room_id === 'number', 'room_id must be a number');

			var entry = 
				this.listWidget.getChildren('.html_list').getChildren('#room_list_entry_' + room_id);
			if(entry && typeof entry.remove === 'function') {
				const duration = 1000;
				entry.html('').setStyle({
					transition: 'height '+duration+'ms ease-in-out',
					height: '0px'
				});
				setTimeout(() => entry.remove(), duration);
			}
		}

		createWidget() {
			var container = $$.create('DIV').addClass('rooms_list')
				.attribute('id', 'rooms_list' + this.session_string + this.id)
				.append( $$.create('H1').html('No rooms avaible') )//header
				.append( //rooms list control panel
					$$.create('DIV').addClass('rooms_list_control_panel')
						/*.append( 
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
								.setText('SEARCH') 
						)*/
						.append( 
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
								.setText('CREATE').on('click', () => Network.createRoom())
						)
				)
				.append(
					$$.create('DIV').addClass('list_container')
						.append( $$.create('DIV').addClass('html_list') )//list of avaible rooms
				);

			return container;
		}
	};
})();