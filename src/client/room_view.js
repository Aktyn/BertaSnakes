const RoomView = (function() {
	var amIsitting = () => Network.getCurrentRoom().isUserSitting( Network.getCurrentUser() );

	const MINIMUM_MINUTES = 0;
	const MAXIMUM_MINUTES = 30;

	const gamemode_names = ['Cooperation', 'Competition'];

	function createMapPreviewWidget(map_name) {
		let map = Maps.getByName(map_name);
		//Object.values(Maps).find(map => typeof map === 'object' && map.name === map_name);
		return $$.create('SPAN').setClass('map_preview').append(
			$$.create('LABEL').setText( map.name )
		).append(
			(() => {
				let canv = $$.create('CANVAS');
				canv.width = map.image.naturalWidth;
				canv.height = map.image.naturalHeight;

				let ctx = canv.getContext('2d', {antialias: true});
				//console.log(map.data);
				ctx.fillStyle = 'rgb(' + map.data['background_color'].join(',') + ')';
				ctx.fillRect(0, 0, canv.width, canv.height);

				ctx.globalCompositeOperation = 'screen';
				ctx.drawImage(map.image, 0, 0, canv.width, canv.height);

				return canv;
			})()
		);
	}

	function createClockWidget(minutes) {
		// jshint multistr:true
		let clock_widget = $$.create('SPAN')
			.append(
				$$.create('SPAN').addClass('clock_chart')
					.html(
						'<svg width="100" height="100">\
							<circle r="25" cx="50" cy="50" class="stroker"></circle>\
							<circle r="35" cx="50" cy="50" class="centered"></circle>\
							<text x="50" y="50" text-anchor="middle" alignment-baseline="central">' + 
								minutes + ' min' + '</text>\
						</svg>'
					)
			);
		let angle = (minutes / MAXIMUM_MINUTES) * 158;
		//setTimeout(() => {
			clock_widget.getChildren('circle.stroker').setStyle({
				'strokeDasharray': angle+' 158'
			});
		//}, 10);

		return clock_widget;
	}

	return class extends SessionWidget {
		constructor() {
			super();
			this.added_users_entries = [];
		}

		get roomWidget() {//TODO - optimize by stroring this widget as class member
			return $$('#room_view' + this.session_string + this.id) || $$(document.body);
		}

		checkOwnership() {
			try {
				var amIowner = Network.getCurrentRoom().getOwner().id === Network.getCurrentUser().id;
				this.roomWidget.getChildren('.room_settings_btn').disabled = !amIowner;
			}
			catch(e) {
				console.error(e);
			}
		}

		onCountdown(time) {//if time is null or undefined it means countdown is stopped
			var countdown_label = this.roomWidget.getChildren('.game_start_countdown_info');
			if(typeof time === 'number')
				countdown_label.addClass('active').setText('Game starting in ' + time + ' sec');
			else
				countdown_label.removeClass('active').setText('Waiting for everyone to be ready');
		}

		onRoomJoined() {//displaying room info
			var current_room = Network.getCurrentRoom();
			$$.assert(current_room instanceof RoomInfo, 'There isn\'t current room');

			this.roomWidget.getChildren('.no_room_info').setStyle({display: 'none'});
			this.roomWidget.getChildren('.room_info').setStyle({display: 'block'});
			
			// this.roomWidget.getChildren('.room_name').setText( current_room.name );
			// this.updateSits(current_room.sits, current_room.readys);
			this.updateRoomInfo(current_room);

			current_room.users.forEach(u => this.addUser(u));

			this.checkOwnership();
		}

		onRoomLeft() {
			try {
				this.roomWidget.getChildren('.no_room_info').setStyle({display: 'inline-block'});
				this.roomWidget.getChildren('.room_info').setStyle({display: 'none'});
				this.roomWidget.getChildren('.game_start_countdown_info')
					.removeClass('active').setText('Waiting for everyone to be ready');
				this.roomWidget.getChildren('.room_settings').remove();

				this.added_users_entries.forEach(entry => entry.nodes.forEach(n => n.remove()));
				this.added_users_entries = [];
			}
			catch(e) {}

			//cleaning previous users list
			let users_list = this.roomWidget.getChildren('.users_list');
			if(!users_list)
				return;
			users_list.html('');
		}

		sitOrStand() {
			try {
				if(amIsitting())
					Network.sendStandUpRequest();
				else
					Network.sendSitRequest();
					
			}
			catch(e) {
				console.error('Cannot send sit/stand request:', e);
			}
		}

		updateRoomInfo(room) {
			$$.assert(room instanceof RoomInfo, 'argument must be instance of RoomInfo');

			try {
				this.roomWidget.getChildren('.room_name').setText( room.name );	
				this.roomWidget.getChildren('.settings_info .map_preview_info').html('')
					.append( createMapPreviewWidget(room.map).addClass('static_preview') );
				//console.log( this.roomWidget.getChildren('.settings_info .map_preview') );
				this.roomWidget.getChildren('.settings_info .game_mode_info').setText(
					gamemode_names[ room.gamemode ]
				);
				this.roomWidget.getChildren('.settings_info .game_duration_info').html('')
					.append( createClockWidget((room.duration / 60) | 0) );
			}
			catch(e) {
				console.log('Not important error: ', e);
			}

			this.updateSits(room.sits, room.readys);
		}

		//@sits - array containing user indexes or zeros, @readys - array of booleans
		updateSits(sits, readys) {
			var current_room = Network.getCurrentRoom();
			$$.assert(current_room instanceof RoomInfo, 'There isn\'t current room');

			sits = sits || current_room.sits;
			readys = readys || current_room.readys;
			
			//console.log(sits);
			let sits_list = this.roomWidget.getChildren('.sits_list');
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
					entry.setText( COMMON.trimString( current_room.getUserByID(sit).nick, 12 ) );
					if(readys[index] === true)
						entry.addClass('ready');
				}
					
				sits_list.append( entry );
			});

			try {
				let sit_or_stand_button = this.roomWidget.getChildren('.sit_or_stand_button');
				sit_or_stand_button.setText(amIsitting() ? 'STAND' : 'SIT');

				//disable sit button when every sit is taken but current user doesn't sit
				sit_or_stand_button.disabled = amIsitting() === false && sits.every(sit => sit !== 0);

				//enabling ready button when every sit is taken
				var ready_btn = this.roomWidget.getChildren('.sit_ready_button');
				//if every sit is taken and current user is sitting
				if(sits.every(sit => sit !== 0) && sits.indexOf(Network.getCurrentUser().id) !== -1)
					ready_btn.disabled = false;
				else
					ready_btn.disabled = true;
			} catch(e) {
				console.error(e);
			}
		}

		addUser(user) {
			let users_list = this.roomWidget.getChildren('.users_list');
			if(!users_list)
				return;

			//store array of DOM nodes associated with user
			let user_nodes = COMMON.createUserEntry(user);
			this.added_users_entries.push({
				id: user.id,
				nodes: user_nodes
			});
			
			users_list.append( user_nodes );

			this.checkOwnership();
		}

		removeUserByID(user_id) {
			$$.assert(typeof user_id === 'number', 'user_id must be a number');

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
			$$.assert(current_room instanceof RoomInfo, 'There isn\'t current room');

			//makes room html elements
			var room_info = this.roomWidget.getChildren('.room_info');
			room_info.setStyle({display: 'none'});

			var name_input = $$.create('INPUT').addClass('text_input')
				.attribute('type', 'text').attribute('name', 'room_name_input')
				.attribute('value', current_room.name).attribute('maxlength', '32');

			var sits_input = COMMON.createNumberInput(1, 6)
				.setValue( current_room.sits.length )//.attribute('name', 'room_sits_input')
				.setStyle({display: 'inline-block', textAlign: 'center'});

			var mode_option = COMMON.createOptionsList(gamemode_names, opt => {
				//if competition
				if(opt === gamemode_names[ RoomInfo.GAME_MODES.COMPETITION ])
					sits_input.setMinimumValue(2);//minimum 2 sits in competition mode
				else
					sits_input.setMinimumValue(1);
			}).selectOption(gamemode_names[ current_room['gamemode'] ])//default option
				.setStyle({
					'display': 'inline-block',
					'margin': '10px',
					'box-shadow': '0px 3px 5px #0003',
					'filter': 'hue-rotate(15deg)'
				});

			var duration_input = 
				COMMON.createNumberInput(MINIMUM_MINUTES, MAXIMUM_MINUTES, null, ' min')
				.setValue( (current_room.duration / 60) | 0 )
				.setStyle({display: 'inline-block', textAlign: 'center'});

			var maps_horizontal_list = $$.create('DIV').setClass('maps_list');
			Maps.onLoad(() => {
				Object.values(Maps)
					.sort((a, b) => b.name === 'Empty' ? 1 : (a.name > b.name ? -1 : 0))
					.forEach(map => {
						if(typeof map !== 'object')//discard functions
							return;
						
						let map_preview = createMapPreviewWidget(map.name).on('click', () => {
							//uncheck all map previews
							this.roomWidget.getChildren('.map_preview')
								.forEach(prev => prev.removeClass('selected'));

							//check chosen one
							map_preview.addClass('selected');
						});
						
						if(current_room.map === map.name)
							map_preview.addClass('selected');
						maps_horizontal_list.append(map_preview);
					});
			});

			var applySettings = () => {////////////////////////////////////////////////////
				//console.log('apply', name_input.value, sits_input.getValue());
				//TODO - sending update request only when any setting has changed
				Network.sendRoomUpdateRequest(name_input.value, sits_input.getValue(),
					duration_input.getValue() * 60,
					this.roomWidget.getChildren('.map_preview.selected > label').html(),
					mode_option.getSelectedOptionIndex());
			};

			var roomSettings = $$.create('DIV').addClass('room_settings').append(
				$$.create('H1').setStyle({display: 'table', borderBottom: '1px solid #90A4AE'}).append(
					$$.create('DIV').setStyle({'display': 'table-cell'}).html('Room settings')
				).append(
					$$.create('DIV').addClass('close_btn').addClass('opacity_and_rot_transition')
						.setStyle({'display': 'table-cell'}).on('click', () => {
							//applying settings before closing
							applySettings();
							//closing room settings
							room_info.setStyle({display: 'block'});
							roomSettings.remove();
						})
				)
			).append(//settings one below each other
				$$.create('DIV').addClass('settings_container').append(//room name
					$$.create('DIV').append( $$.create('LABEL' ).html('Name:'))
						.append( name_input )
				).append(
					$$.create('DIV').append( $$.create('LABEL').html('Mode:') )
						.append( mode_option )
				).append(//sits number
					$$.create('DIV').append( $$.create('LABEL').html('Sits:') )
						.append( sits_input )
				).append(//duration
					$$.create('DIV').append( $$.create('LABEL').html('Duration:') )
						.append( duration_input )
				)
			).append(//list of avaible maps
				maps_horizontal_list
			).append(
				$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
					.html('APPLY').setStyle({margin: '15px'}).on('click', applySettings)
			);

			this.roomWidget.append(roomSettings);
		}

		createWidget() {
			return $$.create('DIV').setClass('room_view')
				.attribute('id', 'room_view' + this.session_string + this.id)
			.append(//not in room info
				$$.create('DIV').html('Join a room to play with other players')
					.addClass('no_room_info')
			).append( 
				$$.create('DIV').setStyle({display: 'none'}).addClass('room_info').append(
					$$.create('H1')//header
						.append( $$.create('BUTTON')
							.addClass('iconic_button').addClass('iconic_settings')
							.addClass('room_settings_btn').attribute('disabled', '')
							.html('EDIT').setStyle({'float': 'left'}).on('click', () => {
								this.openRoomSettings();
							})
						).append( $$.create('SPAN').setClass('room_name')
							.html('name') )
				).append(
					//middle horizontal panel with game settings info
					$$.create('H2').addClass('settings_info')
						.append( $$.create('SPAN').addClass('map_preview_info') )
						.append( $$.create('DIV').addClass('game_mode_info') )
						.append( $$.create('SPAN').addClass('game_duration_info') )
				).append(
					$$.create('DIV').setClass('game_start_countdown_info')
						.html('Waiting for everyone to be ready')
				).append(
					$$.create('SECTION').append(//main content
						$$.create('DIV').setStyle({width: '100%'})
						.append(//sit / stand button
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
								.addClass('sit_or_stand_button')
								.setStyle({gridColumn: '1', gridRow: '1', 
									marginBottom: '10px', marginRight: '10px'})
								.html('SIT').on('click', () => this.sitOrStand())
						)
						.append(//ready button
							$$.create('BUTTON').addClass('iconic_button').addClass('iconic_empty')
								.addClass('sit_ready_button')
								.setStyle({gridColumn: '1', gridRow: '1', marginBottom: '10px'})
								.attribute('disabled', '')
								.html('READY').on('click', () => Network.sendReadyRequest())
						)
					).append(//leave room button
						$$.create('BUTTON').addClass('iconic_button').addClass('iconic_close')
							.setStyle({gridColumn: '2', gridRow: '1', marginBottom: '10px'})
							.html('LEAVE ROOM').on('click', event => {
								//leaving room request
								try {
									Network.leaveRoom();
								}
								catch(e) {
									console.error('cannot send leave room request: ', e);
								}
							})
					).append(//sits list
						$$.create('DIV').addClass('sits_list')
							.setStyle({gridColumn: '1', gridRow: '2'}) 
					).append(//users list container for table
						$$.create('DIV').addClass('users_list_container').append(
							$$.create('DIV').addClass('users_list')//list of users
								.setStyle({gridColumn: '2', gridRow: '2'}) 
						)
					)
				)
			);
		}
	};
})();