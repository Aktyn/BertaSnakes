////<reference path="session_widget.ts"/>
///<reference path="engine/network.ts"/>
///<reference path="common/common.ts"/>
///<reference path="common/utils.ts"/>

class RoomsList/* extends SessionWidget*/ {
	public widget: $_face;
	public switcher_widget: $_face;

	constructor() {
		//super();
		this.widget = $$.create('DIV').addClass('rooms_list')
			//.setAttrib('id', 'rooms_list' + this.session_string + this.id)
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

		var list_hidden = true;//only for smaller screen resolution

		this.switcher_widget = $$.create('DIV').addClass('rooms_list_switcher').addClass('hidden')
			.addClass('opacity_and_rot_transition');
		this.switcher_widget.on('click', () => {
			list_hidden = !list_hidden;

			if(list_hidden) {
				this.switcher_widget.addClass('hidden');
				this.widget.removeClass('showed');
			}
			else {
				this.switcher_widget.removeClass('hidden');
				this.widget.addClass('showed');
			}
		});
	}

	/*get listWidget() {
		return $$('#rooms_list' + this.session_string + this.id) || $$(document.body);
	}*/

	clear() {
		//this.rooms = [];
		try {
			this.widget.getChildren('.html_list').html('');
		}
		catch(e) {}
	}

	onRoomJoined() {
		try {
			var curr_room = Network.getCurrentRoom();
			if(!curr_room)
				throw new Error('CurrentRoom is null');
			this.widget.getChildren("#room_list_entry_" + curr_room.id)
				.addClass('current_room');
		}
		catch(e) {
			console.error(e);
		}
	}

	onRoomLeft() {
		try {
			this.widget.getChildren('.html_list').getChildren('*').removeClass('current_room');
		}
		catch(e) {}
	}

	onRoomUpdate(room: RoomInfo) {
		//$$.assert(room instanceof RoomInfo, 'Argument must be instance of RoomInfo class');

		try {
			let room_row = this.widget.getChildren("#room_list_entry_" + room.id);
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
		try {
			this.widget.getChildren('.html_list').addChild(entry);
			this.widget.getChildren('H1').html('Avaible rooms');
		}
		catch(e) {}
	}

	removeRoomByID(room_id: number) {
		try {
			var entry = this.widget.getChildren('.html_list')
				.getChildren('#room_list_entry_' + room_id);

			if(entry && typeof entry.remove === 'function') {
				const duration = 1000;
				entry.html('').setStyle({
					'transition': 'height '+duration+'ms ease-in-out',
					'height': '0px'
				});
				setTimeout(() => entry.remove(), duration);
			}
		}
		catch(e) {}
	}
}
