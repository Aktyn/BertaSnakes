const InGameGUI = (function() {
	const LEFT_PANEL_WIDTH = 200;
	const NOTIFICATION_LIFETIME = 5 * 1000;

	const EMOTS_FOLDER = '/img/textures/emoticons/';

	const EMOTS = [//NOTE - use uppercase letters for key values
		{	file_name: 'hand.png', 		key: 'Q'	},
		{	file_name: 'happy.svg', 	key: 'E'	},
		{	file_name: 'sad.svg', 		key: 'R'	},
		{	file_name: 'laugh.svg', 	key: 'T'	},
		{	file_name: 'angry.svg', 	key: 'Y'	},
		{	file_name: 'shocked.svg',	key: 'U'	},
		{	file_name: 'inlove.svg',	key: 'I'	},
		{	file_name: 'dead.svg',		key: 'O'	},
	];

	const gamemode_names = ['Cooperation', 'Competition'];

	var s_i;

	const formatTime = (seconds) => {
		let minutes = 0;
		while(seconds >= 60) {
			minutes++;
			seconds-=60;
		}
		let seconds_str = (seconds < 10 ? '0' : '') + seconds + 's';
		if(minutes > 0)
			return (minutes < 10 ? '0' : '') + minutes + 'm ' + seconds_str;
		else
			return seconds_str;
	};

	const toPercent = value => Math.round(Math.min(1, Math.max(0, value))*100) + '%';

	function createSkillButton(texture_name, key, continous) {
		let main_part = $$.create('DIV').addClass('main_part');
		let cooldown_timer = $$.create('DIV').addClass('cooldown').setStyle({'display': 'none'});
		//.setText('')

		let widget = $$.create('SPAN').addClass('skill_button').append(
			main_part.append(
				$$.create('IMG').attribute( 'src', ASSETS.getTexture(texture_name).attribute('src') )
			).append(
				cooldown_timer
			)
		).append(
			$$.create('DIV').addClass('key').setText(key)
		);

		return {
			onUse: function(cooldown_value) {
				if(this.continous)
					main_part.addClass('in_use');
				else {//start countdown
					this.cooldown = cooldown_value || 0;
					this.end_timestamp = Date.now() + (this.cooldown * 1000);
					cooldown_timer.setStyle({'display': 'block'}).setText(Math.round(cooldown_value));
				}
			},
			onStop: function() {
				if(this.continous)
					main_part.removeClass('in_use');
			},
			update: function(delta) {
				if(this.cooldown === 0)
					return;

				let last_sec = Math.round(this.cooldown);

				this.cooldown = ((this.end_timestamp - Date.now())/1000);
				
				if(this.cooldown <= 0) {
					this.cooldown = 0;
					cooldown_timer.setStyle({'display': 'none'});
				}
				else if( last_sec > Math.round(this.cooldown) )
					cooldown_timer.setText( Math.round(this.cooldown) );
			},
			cooldown: 0,
			continous: continous,//false
			widget: widget
		};
	}

	return class {
		constructor() {
			let current_room = Network.getCurrentRoom();

			this.timer = $$.create('SPAN').setText( formatTime(current_room.duration) );
			this.focused_health = $$.create('SPAN').addClass('bar').addClass('health').setText('0%');
			this.focused_energy = $$.create('SPAN').addClass('bar').addClass('energy').setText('0%');
			this.focused_speed  = $$.create('SPAN').addClass('bar').addClass('speed').setText('0%');

			this.focused_speed_value = 0;
			this.focused_hp_value = 0;
			this.focused_energy_value = 0;

			this.players_infos = [];//allows to access player's infos widgets
			this.skills = [];

			this.emoticon_use_listener = null;
			this.skill_use_listener = null;
			this.skill_stop_listener = null;

			this.entries_container = $$.create('DIV').addClass('entries')
				.append(//user's player hp, mp and speed
					$$.create('DIV').addClass('entry')
						.append( this.focused_health )
						.append( this.focused_energy )
						.append( this.focused_speed )
				).append(//game info, timers
					$$.create('DIV').addClass('entry').addClass('gridded').append(
						$$.create('SPAN').setText('Room:')
					).append( $$.create('SPAN').setText( current_room.name ))
					.append( $$.create('SPAN').setText('Map:') )
					.append( $$.create('SPAN').setText( current_room.map ) )
					.append( $$.create('SPAN').setText('Mode:') )
					.append( $$.create('SPAN').setText( gamemode_names[current_room.gamemode] ) )
					.append( $$.create('SPAN').setText('Time:') )
					.append( this.timer )
				);

			this.notifications_container = $$.create('DIV').addClass('notifications');

			var left_panel = $$.create('DIV').addClass('game_gui_left').setStyle({
				width: '' + LEFT_PANEL_WIDTH + 'px'
			}).append( this.entries_container ).append( this.notifications_container );


			this.entries_container.append(
				current_room.sits.map(sit => {
					let player =current_room.getUserByID(sit);

					let player_info = {
						points_widget: $$.create('SPAN').addClass('player_points').setText(0),
						ship_preview_widget: $$.create('SPAN').addClass('player_ship'),
						kills_widget: $$.create('SPAN').addClass('player_kills').setText(0),
						deaths_widget: $$.create('SPAN').addClass('player_deaths').setText(0),
						health_widget: $$.create('DIV').addClass('player_health')
											.setStyle({width: '100%'}),
						energy_widget: $$.create('DIV').addClass('player_energy')
											.setStyle({width: '100%'})
					};

					this.players_infos.push( player_info );

					return $$.create('DIV').addClass('entry').addClass('player_info').append(
						$$.create('SPAN').addClass('player_nick').setText( player.nick )
					)	.append( /*[player_info.points_widget, player_info.kills_widget, 
							player_info.deaths_widget, player_info.health_widget, 
							player_info.energy_widget]*/Object.values(player_info) );
				})
			);

			//console.log(this.players_infos);

			$$(document.body).append(left_panel);

			// SKILLS BAR (EMPTY)
			var footer = $$.create('DIV').setStyle({
				'position': 'fixed',
				'bottom': '0px',
				'width': '100%',
				'textAlign': 'center',
				'pointerEvents': 'none',
			    'display': 'grid',
			    'justify-content': 'center'
			});

			var emots_visible = false;

			let emots_switcher = $$.create('DIV').addClass('opacity_and_rot_transition')
				.addClass('emot_bar_switcher').on('click', () => {
					if((emots_visible = !emots_visible)) {
						emots_switcher.addClass('active');
						this.emots_bar.removeClass('hidden');
					}
					else {
						emots_switcher.removeClass('active');
						this.emots_bar.addClass('hidden');
					}
				});

			this.skills_bar = $$.create('DIV').addClass('skills_bar').append(
				emots_switcher
			);
			this.emots_bar = $$.create('DIV').addClass('emots_bar').addClass('hidden');
			footer.append([this.emots_bar, this.skills_bar]);

			EMOTS.forEach((emot, index) => {
				this.emots_bar.append(
					$$.create('SPAN').addClass('emoticon_button').append(
						$$.create('IMG')
							.attribute('src', EMOTS_FOLDER + emot.file_name)
					).append(
						$$.create('DIV').addClass('key').setText(emot.key)
					).setStyle({'transition-delay': (index*50)+'ms'}).on('click', () => {
						if(typeof this.emoticon_use_listener === 'function')
							this.emoticon_use_listener(index);
					})
				);
			});

			$$(document.body).append(footer);

			/*setInterval(() => {
				this.addNotification( COMMON.generateRandomString(50) );
			}, 2000);*/
			
		}

		static get EMOTS() {
			return EMOTS;
		}

		static get EMOTS_FOLDER() {
			return EMOTS_FOLDER;
		}

		onEmoticonUse(callback) {
			this.emoticon_use_listener = callback;
		}

		onSkillUse(callback) {
			this.skill_use_listener = callback;
		}

		onSkillStop(callback) {
			this.skill_stop_listener = callback;
		}

		updateTimer(duration) {
			// console.log('remaining time:', duration);
			this.timer.setText( formatTime(duration) );
			if(duration === 5 || duration === 10 || duration === 30)
				this.addNotification(duration + ' seconds left');
		}

		addNotification(text) {
			let notif = $$.create('DIV').setClass('notification').setText(text);
			this.notifications_container.append( notif );

			setTimeout(() => {
				notif.addClass('fader');
				setTimeout(() => notif.remove(), 1100);//little longer than animation duration
			}, NOTIFICATION_LIFETIME);
		}

		appendSkill(texture_asset_name, key, continous) {
			let skill_btn = createSkillButton(texture_asset_name, key, continous);
			this.skills.push( skill_btn );
			this.skills_bar.append( skill_btn.widget );

			key = typeof key === 'number' ? key : 0;

			skill_btn.widget.on('mousedown', (e) => {
				if(e.button !== 0)//only LMB
					return;
				if(typeof this.skill_use_listener === 'function')
					this.skill_use_listener(key);
			});

			skill_btn.widget.on('mouseup', (e) => {
				if(e.button !== 0)//only LMB
					return;
				if(typeof this.skill_stop_listener === 'function')
					this.skill_stop_listener(key);
			});
		}

		appendEmptySkill(key) {
			this.skills.push( null );

			this.skills_bar.append(
				$$.create('SPAN').addClass('skill_button').append(
					$$.create('DIV').addClass('main_part')
				).append(
					$$.create('DIV').addClass('key').setText(key)
				)
			);
		}

		onSkillUsed(skill_index, cooldown_value) {
			try {
				this.skills[skill_index].onUse(cooldown_value);
			}
			catch(e) {
				console.error(e);
			}
		}

		onSkillStopped(skill_index) {
			try {
				this.skills[skill_index].onStop();
			}
			catch(e) {
				console.error(e);
			}
		}

		assignPlayerPreview(player_index, ship_type, color_index) {
			try {
				let texture_name = Player.entityName( ship_type, Colors.PLAYERS_COLORS[color_index] );
				this.players_infos[player_index].ship_preview_widget.append(
					$$.create('IMG').attribute( 'src', ASSETS.getTexture(texture_name).toDataURL() )
				).append(
					$$.create('SPAN').addClass('color_stain').setStyle({
						'backgroundColor': Colors.PLAYERS_COLORS[color_index].hex
					})
				);
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerHpChange(player_index, hp_value) {
			try {
				this.players_infos[player_index].health_widget
					.setStyle( {width: toPercent(hp_value)} );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerEnergyChange(player_index, energy_value) {
			try {
				this.players_infos[player_index].energy_widget
					.setStyle( {width: toPercent(energy_value)} );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerPointsChange(player_index, points_value) {
			try {
				this.players_infos[player_index].points_widget.setText( points_value );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerKill(player_index) {
			try {
				let widget = this.players_infos[player_index].kills_widget;
				widget.setText( parseInt(widget.html()) + 1 );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerDeath(player_index) {
			try {
				let widget = this.players_infos[player_index].deaths_widget;
				widget.setText( parseInt(widget.html()) + 1 );
			}
			catch(e) {
				console.error(e);
			}
		}

		update(focused, delta) {//@focused - Player instance
			if(this.focused_speed_value !== focused.movement.speed) {
				this.focused_speed_value = focused.movement.speed;

				var speed_normalized = focused.movement.speed / focused.movement.maxSpeed;
				let percent = toPercent(speed_normalized);
				this.focused_speed.setText( percent ).setStyle( {'width': percent} );
			}
			if(this.focused_hp_value !== focused.hp) {
				this.focused_hp_value = focused.hp;

				let percent = toPercent(focused.hp);
				this.focused_health.setText( percent ).setStyle( {'width': percent} );
			}
			if(this.focused_energy_value !== focused.energy) {
				this.focused_energy_value = focused.energy;

				let percent = toPercent(focused.energy);
				this.focused_energy.setText( percent ).setStyle( {'width': percent} );
			}

			for(s_i=0; s_i<this.skills.length; s_i++) {
				if(this.skills[s_i] !== null)
					this.skills[s_i].update(delta);
			}
		}
	};
})();