///<reference path="engine/network.ts"/>
///<reference path="../include/game/maps.ts"/>
////<reference path="session_widget.ts"/>

//const RoomView = (function() {

interface RoomUserEntry {
	id: number;
	nodes: $_face[];
}

class RoomView/* extends SessionWidget*/ {
	private static amIsitting = function() {
		try {
			//@ts-ignore
			return Network.getCurrentRoom().isUserSitting( Network.getCurrentUser().id )
		}
		catch(e) {
			return false;
		}
	}

	private static MINIMUM_MINUTES = 0;
	private static MAXIMUM_MINUTES = 30;

	private static gamemode_names = ['Cooperation', 'Competition'];

	private static createMapPreviewWidget = function(map_name: string) {
		let map = Maps.getByName(map_name);
		if(map === null)
			throw "Cannot find map by it's name: " + map_name;
			
		//if(map === null || map.image === null || map.data === null)
		//	throw `Map or it's image or it's data not found (${map_name})`;

		//Object.values(Maps).find(map => typeof map === 'object' && map.name === map_name);
		return $$.create('SPAN').setClass('map_preview').addChild(
			$$.create('LABEL').setText( map['name'] )
		).addChild(
			(() => {
				let bg_scale = map['background_scale'] / map['map_size'];

				let canv = document.createElement('canvas');
				canv.width = 150;
				canv.height = 150;

				let ctx = <CanvasRenderingContext2D>canv.getContext('2d', {antialias: true});

				let steps = Math.round( (1 / bg_scale) / 2 );
				for(let x=-steps; x<=steps; x++) {
					for(let y=-steps; y<=steps; y++) {
						ctx.drawImage(map['background_texture'], 
							canv.width*( (1-bg_scale)/2 + x*bg_scale ), 
							canv.height*( (1-bg_scale)/2 + y*bg_scale ), 
							canv.width*bg_scale, canv.height*bg_scale);
					}
				}
				
				let w_canv = document.createElement('canvas');
				w_canv.width = 150;
				w_canv.height = 150;
				let w_ctx = <CanvasRenderingContext2D>w_canv.getContext('2d', {antialias: true});
				w_ctx.fillStyle = '#000';
				w_ctx.fillRect(0, 0, w_canv.width, w_canv.height);
				w_ctx.drawImage(map['walls_texture'], 0, 0, w_canv.width, w_canv.height);

				let b_data = ctx.getImageData(0, 0, canv.width, canv.height);
				let w_data = w_ctx.getImageData(0, 0, w_canv.width, w_canv.height);

				let wallsColor = map['walls_color']; //Colors.WALLS.byte_buffer;

				for(let x=0; x<canv.width; x++) {
					for(let y=0; y<canv.height; y++) {
						var index = (x + y*canv.width) * 4;

						if(w_data.data[index] > 0) {
							b_data.data[index+0] = wallsColor[0];
							b_data.data[index+1] = wallsColor[1];
							b_data.data[index+2] = wallsColor[2];
						}
					}
				}

				ctx.putImageData(b_data, 0, 0);

				return canv;
			})()
		);
	}

	private static createClockWidget = function(minutes: number) {
		// jshint multistr:true
		let clock_widget = $$.create('SPAN')
			.addChild( 
				$$.create('SPAN').addClass('clock_chart').html(
					'<svg width="100" height="100">\
						<circle r="25" cx="50" cy="50" class="stroker"></circle>\
						<circle r="35" cx="50" cy="50" class="centered"></circle>\
						<text x="50" y="50" text-anchor="middle" alignment-baseline="central">' + 
							minutes + ' min' + '</text>\
					</svg>'
				)
			);
		let angle = (minutes / RoomView.MAXIMUM_MINUTES) * 158;
		//setTimeout(() => {
			clock_widget.getChildren('circle.stroker').setStyle({
				'strokeDasharray': angle+' 158'
			});
		//}, 10);

		return clock_widget;
	}


	private added_users_entries: RoomUserEntry[] = [];

	public widget: $_face;

	constructor() {
		//super();
		this.widget = this.createWidget();
	}

	/*get roomWidget() {//TODO - optimize by stroring this widget as class member
		return $$('#room_view' + this.session_string + this.id) || $$(document.body);
	}*/

	checkOwnership() {
		try {
			//@ts-ignore
			var amIowner = Network.getCurrentRoom().getOwner().id === Network.getCurrentUser().id;
			this.widget.getChildren('.room_settings_btn').disabled = !amIowner;
		}
		catch(e) {
			console.error(e);
		}
	}

	onCountdown(time: number) {//if time is null or undefined it means countdown is stopped
		var countdown_label = this.widget.getChildren('.game_start_countdown_info');
		if(typeof time === 'number')
			countdown_label.addClass('active').setText('Game starting in ' + time + ' sec');
		else
			countdown_label.removeClass('active').setText('Waiting for everyone to be ready');
	}

	onRoomJoined() {//displaying room info
		var current_room = Network.getCurrentRoom();
		if(current_room === null) throw new Error('There isn\'t current room');

		this.widget.getChildren('.no_room_info').setStyle({display: 'none'});
		this.widget.getChildren('.room_info').setStyle({display: 'inline-block'});
		
		// this.widget.getChildren('.room_name').setText( current_room.name );
		// this.updateSits(current_room.sits, current_room.readys);
		this.updateRoomInfo(current_room);

		current_room.users.forEach(u => this.addUser(u));

		this.checkOwnership();
	}

	onRoomLeft() {
		try {
			this.widget.getChildren('.no_room_info').setStyle({display: 'inline-block'});
			this.widget.getChildren('.room_info').setStyle({display: 'none'});
			this.widget.getChildren('.game_start_countdown_info')
				.removeClass('active').setText('Waiting for everyone to be ready');
			this.widget.getChildren('.room_settings').remove();

			this.added_users_entries.forEach(entry => entry.nodes.forEach(n => n.remove()));
			this.added_users_entries = [];
		}
		catch(e) {}

		//cleaning previous users list
		let users_list = this.widget.getChildren('.users_list');
		if(!users_list)
			return;
		users_list.html('');
	}

	sitOrStand() {
		try {
			if(RoomView.amIsitting())
				Network.sendStandUpRequest();
			else
				Network.sendSitRequest();
				
		}
		catch(e) {
			console.error('Cannot send sit/stand request:', e);
		}
	}

	updateRoomInfo(room: RoomInfo | null) {
		if(room === null)
			throw new Error('null argument');
		//$$.assert(room instanceof RoomInfo, 'argument must be instance of RoomInfo');

		try {
			this.widget.getChildren('.room_name').setText( room.name );	
			this.widget.getChildren('.settings_info .map_preview_info').html('')
				.addChild( RoomView.createMapPreviewWidget(room.map).addClass('static_preview') );
			//console.log( this.widget.getChildren('.settings_info .map_preview') );
			this.widget.getChildren('.settings_info .game_mode_info').setText(
				RoomView.gamemode_names[ room.gamemode ]
			);
			this.widget.getChildren('.settings_info .game_duration_info').html('')
				.addChild( RoomView.createClockWidget((room.duration / 60) | 0) );
		}
		catch(e) {
			console.log('Not important error: ', e);
		}

		this.updateSits(room.sits, room.readys);
	}

	updateSits(sits?: number[], readys?: boolean[]) {
		var current_room = Network.getCurrentRoom();
		if(current_room === null) throw new Error('There isn\'t current room');

		sits = sits || current_room.sits;
		readys = readys || current_room.readys;
		
		//console.log(sits);
		let sits_list = this.widget.getChildren('.sits_list');
		if(!sits_list)
			return;
		sits_list.html('');//removing previous content
		
		sits.forEach((sit, index) => {
			if(typeof sit !== 'number')
				throw new Error('Incorrect array data (must contain only null or UserInfo');

			var entry = $$.create('DIV');
			if(sit === 0)
				entry.addClass('empty').setText('EMPTY');
			else {
				var sitting_user = (<RoomInfo>current_room).getUserByID(sit);
				if(sitting_user)
					entry.setText( COMMON.trimString( sitting_user.nick, 12 ) );
				if((<boolean[]>readys)[index] === true)
					entry.addClass('ready');
			}
				
			sits_list.addChild( entry );
		});

		try {
			let sit_or_stand_button = this.widget.getChildren('.sit_or_stand_button');
			sit_or_stand_button.setText(RoomView.amIsitting() ? 'STAND' : 'SIT');

			//disable sit button when every sit is taken but current user doesn't sit
			sit_or_stand_button.disabled = RoomView.amIsitting() === false && 
				sits.every(sit => sit !== 0);

			//enabling ready button when every sit is taken
			var ready_btn = this.widget.getChildren('.sit_ready_button');
			
			//@ts-ignore //if every sit is taken and current user is sitting
			if(sits.every(sit => sit !== 0) && sits.indexOf(Network.getCurrentUser().id) !== -1)
				ready_btn.disabled = false;
			else
				ready_btn.disabled = true;
		} catch(e) {
			console.error(e);
		}
	}

	addUser(user: UserInfo) {
		let users_list = this.widget.getChildren('.users_list');
		if(!users_list)
			return;

		//store array of DOM nodes associated with user
		let user_nodes = COMMON.createUserEntry(user);
		this.added_users_entries.push({
			id: user.id,
			nodes: user_nodes
		});
		
		users_list.addChild( user_nodes );

		this.checkOwnership();
	}

	removeUserByID(user_id: number) {
		// $$.assert(typeof user_id === 'number', 'user_id must be a number');

		for(let i=0; i<this.added_users_entries.length; i++) {
			let entry = this.added_users_entries[i];
			if(entry.id === user_id) {
				entry.nodes.forEach(node => node.remove());
				this.added_users_entries.splice(i, 1);
				i--;
			}
		}

		this.updateSits();
		this.checkOwnership();
	}

	openRoomSettings() {
		var current_room = Network.getCurrentRoom();
		if(current_room === null) throw new Error('There isn\'t current room');

		//makes room html elements
		var room_info = this.widget.getChildren('.room_info');
		room_info.setStyle({display: 'none'});

		var name_input = $$.create('INPUT').addClass('text_input')
			.setAttrib('type', 'text').setAttrib('name', 'room_name_input')
			.setAttrib('value', current_room.name).setAttrib('maxlength', '32');

		var sits_input = COMMON.createNumberInput(1, 6)
			.setValue( current_room.sits.length )//.setAttrib('name', 'room_sits_input')
			.setStyle({display: 'inline-block', textAlign: 'center'});

		var mode_option = COMMON.createOptionsList(RoomView.gamemode_names, (opt) => {
			//if competition
			if(opt === RoomView.gamemode_names[ GAME_MODES.COMPETITION ])
				sits_input.setMinimumValue(2);//minimum 2 sits in competition mode
			else
				sits_input.setMinimumValue(1);
		}).selectOption(RoomView.gamemode_names[ current_room['gamemode'] ])//default option
			.setStyle({
				'display': 'inline-block',
				'margin': '10px',
				'box-shadow': '0px 3px 5px #0003',
				'filter': 'hue-rotate(15deg)'
			});

		var duration_input = 
			COMMON.createNumberInput(RoomView.MINIMUM_MINUTES, RoomView.MAXIMUM_MINUTES, 
				undefined, ' min')
			.setValue( (current_room.duration / 60) | 0 )
			.setStyle({display: 'inline-block', textAlign: 'center'});

		var maps_horizontal_list = $$.create('DIV').setClass('maps_list');
		Maps.onLoad(() => {
			Object.keys(Maps).map(key => Maps[key])
				.sort((a, b) => b.name === 'Empty' ? 1 : (a.name > b.name ? -1 : 0))
				.forEach(map => {
					if(typeof map !== 'object')//discard functions
						return;
					
					let map_preview = RoomView.createMapPreviewWidget(map.name).on('click', () => {
						//uncheck all map previews
						this.widget.getChildren('.map_preview')
							.forEach((prev: $_face) => prev.removeClass('selected'));

						//check chosen one
						map_preview.addClass('selected');
					});
					
					if((<RoomInfo>current_room).map === map.name)
						map_preview.addClass('selected');
					maps_horizontal_list.addChild(map_preview);
				});
		});

		var applySettings = () => {////////////////////////////////////////////////////
			//console.log('apply', name_input.value, sits_input.getValue());
			//TODO - sending update request only when any setting has changed
			Network.sendRoomUpdateRequest(name_input.value, sits_input.getValue(),
				duration_input.getValue() * 60,
				this.widget.getChildren('.map_preview.selected > label').innerHTML,
				mode_option.getSelectedOptionIndex());
		};

		var roomSettings = $$.create('DIV').addClass('room_settings').addChild(
			$$.create('H1')
				.setStyle({display: 'table', borderBottom: '1px solid #90A4AE'}).addChild(
					$$.create('DIV').setStyle({
						'display': 'table-cell',
						'padding': '0px 20px'
					}).html('Room settings')
				).addChild(
					$$.create('DIV').addClass('close_btn').addClass('opacity_and_rot_transition')
						.setStyle({'display': 'table-cell'}).on('click', () => {
							//applying settings before closing
							applySettings();
							//closing room settings
							room_info.setStyle({display: 'inline-block'});
							roomSettings.remove();
						})
				)
		).addChild(//settings one below each other
			$$.create('DIV').addClass('settings_container').addChild(//room name
				$$.create('DIV').addChild( $$.create('LABEL' ).html('Name:'))
					.addChild( name_input )
			).addChild(
				$$.create('DIV').addChild( $$.create('LABEL').html('Mode:') )
					.addChild( mode_option )
			).addChild(//sits number
				$$.create('DIV').addChild( $$.create('LABEL').html('Sits:') )
					.addChild( sits_input )
			).addChild(//duration
				$$.create('DIV').addChild( $$.create('LABEL').html('Duration:') )
					.addChild( duration_input )
			)
		).addChild(//list of avaible maps
			maps_horizontal_list
		).addChild(
			$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
				.html('APPLY').setStyle({margin: '15px'}).on('click', applySettings)
		);

		this.widget.addChild(roomSettings);
	}

	private createWidget() {
		return $$.create('DIV').setClass('room_view')
			//.setAttrib('id', 'room_view' + this.session_string + this.id)
		.addChild(//not in room info
			$$.create('DIV').html('Join a room to play with other players')
				.addClass('no_room_info')
		).addChild( 
			$$.create('DIV').setStyle({display: 'none'}).addClass('room_info').addChild(
				$$.create('H1')//header
					.addChild( $$.create('BUTTON')
						.addClass('iconic_button').addClass('iconic_settings')
						.addClass('room_settings_btn').setAttrib('disabled', '')
						.html('EDIT').setStyle({'float': 'left'}).on('click', () => {
							this.openRoomSettings();
						})
					).addChild( $$.create('SPAN').setClass('room_name')
						.html('name') )
			).addChild(
				//middle horizontal panel with game settings info
				$$.create('H2').addClass('settings_info')
					.addChild( $$.create('SPAN').addClass('map_preview_info') )
					.addChild( $$.create('DIV').addClass('game_mode_info') )
					.addChild( $$.create('SPAN').addClass('game_duration_info') )
			).addChild(
				$$.create('DIV').setClass('game_start_countdown_info')
					.html('Waiting for everyone to be ready')
			).addChild(
				$$.create('SECTION').addChild(//main content
					$$.create('DIV').setStyle({width: '100%'})
					.addChild(//sit / stand button
						$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
							.addClass('sit_or_stand_button')
							.setStyle({/*gridColumn: '1', gridRow: '1',*/ 
								marginBottom: '10px', marginRight: '10px'})
							.html('SIT').on('click', () => this.sitOrStand())
					)
					.addChild(//ready button
						$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
							.addClass('sit_ready_button')
							.setStyle({/*gridColumn: '1', gridRow: '1', */marginBottom: '10px'})
							.setAttrib('disabled', '')
							.html('READY').on('click', () => Network.sendReadyRequest())
					)
				).addChild(//leave room button
					$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
						.setStyle({/*gridColumn: '2', gridRow: '1', */marginBottom: '10px'})
						.html('LEAVE ROOM').on('click', event => {
							//leaving room request
							try {
								Network.leaveRoom();
							}
							catch(e) {
								console.error('cannot send leave room request: ', e);
							}
						})
				).addChild(//sits list
					$$.create('DIV').addClass('sits_list')
						//.setStyle({gridColumn: '1', gridRow: '2'}) 
				).addChild(//users list container for table
					$$.create('DIV').addClass('users_list_container').addChild(
						$$.create('DIV').addClass('users_list')//list of users
							//.setStyle({gridColumn: '2', gridRow: '2'}) 
					)
				)
			)
		);
	}
}
//})();