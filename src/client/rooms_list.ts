///<reference path="session_widget.ts"/>
///<reference path="engine/network.ts"/>
///<reference path="common/common.ts"/>

class RoomsList extends SessionWidget {
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
			var curr_room = Network.getCurrentRoom();
			if(!curr_room)
				throw new Error('CurrentRoom is null');
			this.listWidget.getChildren("#room_list_entry_" + curr_room.id)
				.addClass('current_room');
		}
		catch(e) {
			console.error(e);
		}
	}

	onRoomLeft() {
		this.listWidget.getChildren('.html_list').getChildren('*').removeClass('current_room');
	}

	onRoomUpdate(room: RoomInfo) {
		//$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');

		try {
			let room_row = this.listWidget.getChildren("#room_list_entry_" + room.id);
			room_row.getChildren('.room_sits_info')
				.setText(room.taken_sits + '/' + room.sits.length);
			room_row.getChildren('.room_name_info').setText( COMMON.trimString(room.name, 10) )
				.setAttrib('name', room.name);//atribute contains full name
			room_row.getChildren('.room_map_info').setText( room.map );
			room_row.getChildren('.room_mode_info').setText(
				room.gamemode === GAME_MODES.COOPERATION ? 'Coop' : 'Comp' );
			room_row.getChildren('.room_duration_info')
				.setText( ((room.duration / 60)|0) + ' min' );
		}
		catch(e) {
			console.error(e);
		}
	}

	pushRoomInfo(room: RoomInfo) {
		//$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');

		var entry = $$.create('DIV').setAttrib('id', 'room_list_entry_' + room.id)
			.addChild( $$.create('SPAN').setText( COMMON.trimString(room.name, 10) )
				.addClass('room_name_info').setAttrib('name', room.name)
				.setStyle({'gridColumn': '1', textAlign: 'left'}) )
			.addChild( $$.create('SPAN').addClass('room_sits_info')
				.setText(room.taken_sits + '/' + room.sits.length)
				.setStyle({'gridColumn': '2'}) )
			.addChild( $$.create('SPAN').addClass('room_duration_info')
				.setText( ((room.duration / 60)|0) + ' min' ) )
			.addChild( $$.create('SPAN').addClass('room_map_info')
				.setText( room.map ) )
			.addChild( $$.create('SPAN').addClass('room_mode_info')
				.setText( room.gamemode === GAME_MODES.COOPERATION ? 'Coop' : 'Comp' ) )
			.on('click', (e) => {
				Network.joinRoom(room.id);
			});
			//.addChild( $$.create('SPAN').html('USERS - todo').setStyle({gridColumn: '3'}) );
		this.listWidget.getChildren('.html_list').addChild(entry);
		this.listWidget.getChildren('H1').html('Avaible rooms');
	}

	removeRoomByID(room_id: number) {
		//$$.assert(typeof room_id === 'number', 'room_id must be a number');
		var entry = 
			this.listWidget.getChildren('.html_list').getChildren('#room_list_entry_' + room_id);
		if(entry && typeof entry.remove === 'function') {
			const duration = 1000;
			entry.html('').setStyle({
				'transition': 'height '+duration+'ms ease-in-out',
				'height': '0px'
			});
			setTimeout(() => entry.remove(), duration);
		}
	}

	createWidget(): $_face {
		var container = $$.create('DIV').addClass('rooms_list')
			.setAttrib('id', 'rooms_list' + this.session_string + this.id)
			.addChild( $$.create('H1').html('No rooms avaible') )//header
			.addChild( //rooms list control panel
				$$.create('DIV').addClass('rooms_list_control_panel')
					/*.addChild( 
						$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
							.setText('SEARCH') 
					)*/
					.addChild( 
						$$.create('BUTTON').addClass('iconic_button').addClass('iconic_add')
							.setText('CREATE').on('click', () => Network.createRoom())
					)
			)
			.addChild(
				$$.create('DIV').addClass('list_container')
					.addChild( $$.create('DIV').addClass('html_list') )//list of avaible rooms
			);

		return container;
	}
}
