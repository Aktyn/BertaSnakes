///<reference path="../common/utils.ts"/>
///<reference path="../engine/assets.ts"/>
///<reference path="../engine/network.ts"/>
///<reference path="../../include/game/objects/player.ts"/>
///<reference path="../../include/game/common/colors.ts"/>

namespace ClientGame {

	interface GUI_SkillButton {
		onUse: (cd: number) => void;
		onStop: () => void;
		update: (delta: number) => void;

		cooldown: number;
		end_timestamp: number;
		continous: boolean;
		widget: $_face;
	}

	interface GUI_PlayerInfo {
		points_widget: $_face;
		ship_preview_widget: $_face;
		kills_widget: $_face;
		deaths_widget: $_face;
		health_widget: $_face;
		energy_widget: $_face;

		[index: string]: $_face;
	}

	export const TurnDirection = {
		LEFT: 0, 
		RIGHT: 1, 
		UP: 2, 
		DOWN: 3, 
		NONE: 4
	};

	export class GameGUI {
		private static formatTime = function(seconds: number) {
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

		private static toPercent = function(value: number) {
			return Math.round(Math.min(1, Math.max(0, value))*100) + '%';
		};

		private static createSkillButton = function(texture_name: string, key: number | string, 
			continous: boolean): GUI_SkillButton 
		{
			let main_part = $$.create('DIV').addClass('main_part');
			let cooldown_timer = $$.create('DIV').addClass('cooldown').setStyle({'display': 'none'});

			let texture_source = ASSETS.getTexture(texture_name).getAttribute('src');
			if(texture_source === null)
				throw "Texture has no source";

			let widget = $$.create('SPAN').addClass('skill_button').addChild(
				main_part.addChild(
					$$.create('IMG').setAttrib( 'src', texture_source )
				).addChild(
					cooldown_timer
				)
			);

			if(Device.info.is_mobile === false)
				widget.addChild( $$.create('DIV').addClass('key').setText(key) );

			return {
				onUse: function(cooldown_value) {
					if(this.continous)
						main_part.addClass('in_use');
					else {//start countdown
						this.cooldown = cooldown_value || 0;
						this.end_timestamp = Date.now() + (this.cooldown * 1000);
						cooldown_timer.setStyle({'display': 'block'})
							.setText(Math.round(cooldown_value));
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
				end_timestamp: 0,
				continous: continous,//false
				widget: widget
			};
		};

		private static LEFT_PANEL_WIDTH = 200;
		private static NOTIFICATION_LIFETIME = 5 * 1000;

		public static EMOTS_FOLDER = '/img/textures/emoticons/';

		public static EMOTS = [//NOTE - use uppercase letters for key values
			{	file_name: 'hand.png', 		key: 'Q'	},
			{	file_name: 'happy.svg', 	key: 'E'	},
			{	file_name: 'sad.svg', 		key: 'R'	},
			{	file_name: 'laugh.svg', 	key: 'T'	},
			{	file_name: 'angry.svg', 	key: 'Y'	},
			{	file_name: 'shocked.svg',	key: 'U'	},
			{	file_name: 'inlove.svg',	key: 'I'	},
			{	file_name: 'dead.svg',		key: 'O'	},
		];

		private static gamemode_names = ['Cooperation', 'Competition'];

		private timer: $_face;

		private focused_health: $_face;
		private focused_energy: $_face;
		private focused_speed: $_face;
		private focused_speed_value = 0;
		private focused_hp_value = 0;
		private focused_energy_value = 0;
		private players_infos: GUI_PlayerInfo[] = [];
		private skills: (GUI_SkillButton | null)[] = [];
		private emoticon_use_listener: ((arg: number) => void) | null = null;
		private skill_use_listener: ((arg: number | string) => void) | null = null;
		private skill_stop_listener: ((arg: number | string) => void) | null = null;
		private turn_arrow_listener: ((arg: number, released: boolean) => void) | null = null;
		private on_speed_change_listener: ((arg: number) => void) | null = null;

		private mobile_speed_state = 1;//only in mobile mode

		private entries_container: $_face;
		private notifications_container?: $_face;
		private emots_bar: $_face;
		private skills_bar: $_face;

		constructor() {
			let current_room = Network.getCurrentRoom();
			if(current_room === null)
				throw new Error('No current room');

			this.timer = $$.create('SPAN').setText( GameGUI.formatTime(current_room.duration) );
			this.focused_health = $$.create('SPAN').addClass('bar').addClass('health').setText('0%');
			this.focused_energy = $$.create('SPAN').addClass('bar').addClass('energy').setText('0%');
			this.focused_speed  = $$.create('SPAN').addClass('bar').addClass('speed').setText('0%');

			// this.focused_speed_value = 0;
			// this.focused_hp_value = 0;
			// this.focused_energy_value = 0;

			// this.players_infos = [];//allows to access player's infos widgets
			this.skills = [];

			// this.emoticon_use_listener = null;
			// this.skill_use_listener = null;
			// this.skill_stop_listener = null;

			var game_info = $$.create('DIV').addClass('entry').addClass('gridded');

			if(Device.info.is_mobile === false) {
				game_info.addChild( $$.create('SPAN').setText('Room:'))	
					.addChild( $$.create('SPAN').setText( current_room.name ) )
					.addChild( $$.create('SPAN').setText('Map:') )
					.addChild( $$.create('SPAN').setText( current_room.map ) )
					.addChild( $$.create('SPAN').setText('Mode:') )
					.addChild( 
						$$.create('SPAN').setText( GameGUI.gamemode_names[current_room.gamemode] ) 
					);
			}
			game_info.addChild( $$.create('SPAN').setText('Time:') ).addChild( this.timer );

			this.entries_container = $$.create('DIV').addClass('entries')
				.addChild(//user's player hp, mp and speed
					$$.create('DIV').addClass('entry')
						.addChild( this.focused_health )
						.addChild( this.focused_energy )
						.addChild( this.focused_speed )
				).addChild(//game info, timers
					game_info
				);

			var left_panel = $$.create('DIV').addClass('game_gui_left').setStyle({
				'width': '' + GameGUI.LEFT_PANEL_WIDTH + 'px'
			}).addChild( this.entries_container );

			if(Device.info.is_mobile === false) {
				this.notifications_container = $$.create('DIV').addClass('notifications');
				left_panel.addChild( this.notifications_container );
			}
			else
				left_panel.addClass('mobile');
			
			this.entries_container.addChild(
				current_room.sits.map(sit => {
					let player = current_room && current_room.getUserByID(sit);
					if(player === null)
						throw new Error('Cannot find player by it\'s sit id');

					let player_info: GUI_PlayerInfo = {
						points_widget: $$.create('SPAN').addClass('player_points').setText(0),
						ship_preview_widget: $$.create('SPAN').addClass('player_ship'),
						kills_widget: $$.create('SPAN').addClass('player_kills').setText(0),
						deaths_widget: $$.create('SPAN').addClass('player_deaths').setText(0),
						health_widget: $$.create('DIV').addClass('player_health')
											.setStyle({'width': '100%'}),
						energy_widget: $$.create('DIV').addClass('player_energy')
											.setStyle({'width': '100%'})
					};

					this.players_infos.push( player_info );

					return $$.create('DIV').addClass('entry').addClass('player_info').addChild(
						$$.create('SPAN').addClass('player_nick').setText( player.nick )
					)	.addChild( Object.keys(player_info).map(key => player_info[key]) );
				})
			);

			//console.log(this.players_infos);

			$$(document.body).addChild(left_panel);

			// SKILLS BAR (EMPTY)
			var footer = $$.create('DIV').addClass('game_gui_bottom');

			if(Device.info.is_mobile) {
				var speed_controller_child = $$.create('DIV');
				var speed_controller = $$.create('DIV').addClass('speed_controller')
					.addChild(speed_controller_child);
				
				for(var i=0; i<10; i++) {
					//244, 67, 54
					//139, 195, 74
					var factor = i / 9;
					var r = 244* (1 - factor) + 139 * factor;
					var g = 67 * (1 - factor) + 195 * factor;
					var b = 54 * (1 - factor) + 74  * factor;

					speed_controller_child.addChild( 
						$$.create('SPAN').setStyle({
							'background-color': `rgb(${r}, ${g}, ${b})`
						}) 
					);
				}

				var checkSpeedFactor = () => {
					var factor = 1.0 - speed_controller_child.scrollTop / 
						(speed_controller_child.scrollHeight - speed_controller_child.clientHeight);
					//console.log(factor);
					this.mobile_speed_state = factor;
				};

				speed_controller_child.on('touchmove', checkSpeedFactor);
				speed_controller_child.on('touchend', () => setTimeout(checkSpeedFactor, 500))

				var turn_left_btn = $$.create('DIV').setStyle({'transform': 'rotate(90deg)'});
				var turn_right_btn = $$.create('DIV').setStyle({'transform': 'rotate(270deg)'});

				var onTurnClick = (dir: number, released: boolean, e: Event) => {
					if(typeof this.turn_arrow_listener === 'function') {
						this.turn_arrow_listener(dir, released);

						if(dir === TurnDirection.LEFT)
							turn_left_btn.style.opacity = released ? '0.5' : '1';
						else
							turn_right_btn.style.opacity = released ? '0.5' : '1';
					}

					e.preventDefault();
				};

				turn_left_btn.on('touchstart', (e) => onTurnClick(TurnDirection.LEFT, false, e));
				turn_left_btn.on('touchend', (e) => onTurnClick(TurnDirection.LEFT, true, e));
				turn_left_btn.on('touchcancel', (e) => onTurnClick(TurnDirection.LEFT, true, e));

				turn_right_btn.on('touchstart', (e) => onTurnClick(TurnDirection.RIGHT, false, e));
				turn_right_btn.on('touchend', (e) => onTurnClick(TurnDirection.RIGHT, true, e));
				turn_right_btn.on('touchcancel', (e) => onTurnClick(TurnDirection.RIGHT, true, e));

				var turn_controller = $$.create('DIV').addClass('turn_controller')
					.addChild([turn_left_btn, turn_right_btn]);

				footer.addChild([speed_controller, turn_controller]).addClass('mobile');
			}

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

			this.skills_bar = $$.create('DIV').addClass('skills_bar').addChild(
				emots_switcher
			);
			if(Device.info.is_mobile)
				this.skills_bar.setStyle({'padding-bottom': '8px'});
			this.emots_bar = $$.create('DIV').addClass('emots_bar').addClass('hidden');
			footer.addChild([this.emots_bar, this.skills_bar]);

			GameGUI.EMOTS.forEach((emot, index) => {
				var emot_btn = $$.create('SPAN').addClass('emoticon_button').addChild(
					$$.create('IMG')
						.setAttrib('src', GameGUI.EMOTS_FOLDER + emot.file_name)
				).setStyle({'transition-delay': (index*50)+'ms'}).on('click', () => {
					if(typeof this.emoticon_use_listener === 'function')
						this.emoticon_use_listener(index);
				});

				if(Device.info.is_mobile === false)
					emot_btn.addChild( $$.create('DIV').addClass('key').setText(emot.key) );

				this.emots_bar.addChild( emot_btn );
			});

			$$(document.body).addChild(footer);

			/*setInterval(() => {
				this.addNotification( COMMON.generateRandomString(50) );
			}, 2000);*/
			
		}

		/*static get EMOTS() {
			return EMOTS;
		}*/

		/*static get EMOTS_FOLDER() {
			return EMOTS_FOLDER;
		}*/

		onEmoticonUse(callback: (arg: number) => void) {
			this.emoticon_use_listener = callback;
		}

		onSkillUse(callback: (arg: number| string) => void) {
			this.skill_use_listener = callback;
		}

		onSkillStop(callback: (arg: number | string) => void) {
			this.skill_stop_listener = callback;
		}

		onTurnArrowPressed(callback: (dir: number, released: boolean) => void) {//only mobile
			this.turn_arrow_listener = callback;
		}

		onSpeedChange(callback: (dir: number) => void) {
			this.on_speed_change_listener = callback;
		}

		updateTimer(duration: number) {
			// console.log('remaining time:', duration);
			this.timer.setText( GameGUI.formatTime(duration) );
			if(duration === 5 || duration === 10 || duration === 30)
				this.addNotification(duration + ' seconds left');
		}

		addNotification(text: string) {
			if(!this.notifications_container)
				return;
			let notif = $$.create('DIV').setClass('notification').setText(text);
			this.notifications_container.addChild( notif );

			setTimeout(() => {
				notif.addClass('fader');
				setTimeout(() => notif.remove(), 1100);//little longer than animation duration
			}, GameGUI.NOTIFICATION_LIFETIME);
		}

		addChildSkill(texture_asset_name: string, key: number | string, continous: boolean) {
			let skill_btn = GameGUI.createSkillButton(texture_asset_name, key, continous);
			this.skills.push( skill_btn );
			this.skills_bar.addChild( skill_btn.widget );

			var startSkill = (e: Event) => {
				if(Device.info.is_mobile === false && (<MouseEvent>e).button !== 0)//only LMB
					return;
				if(typeof this.skill_use_listener === 'function')
					this.skill_use_listener(key);
				e.preventDefault();
			};

			var cancelSkill = (e: Event) => {
				if(Device.info.is_mobile === false && (<MouseEvent>e).button !== 0)//only LMB
					return;
				if(typeof this.skill_stop_listener === 'function')
					this.skill_stop_listener(key);
			};

	  		if(Device.info.is_mobile === false) {
		  		skill_btn.widget.on('mousedown', startSkill);
				skill_btn.widget.on('mouseup', cancelSkill);
				skill_btn.widget.on('mouseleave', cancelSkill);
			}
			else {
				skill_btn.widget.on('touchstart', startSkill);
				skill_btn.widget.on('touchend', cancelSkill);
				skill_btn.widget.on('touchcancel', cancelSkill);
			}
		}

		addChildEmptySkill(key: number) {
			this.skills.push( null );

			this.skills_bar.addChild(
				$$.create('SPAN').addClass('skill_button').addChild(
					$$.create('DIV').addClass('main_part')
				)/*.addChild(
					$$.create('DIV').addClass('key').setText(key)
				)*/
			);
		}

		onSkillUsed(skill_index: number, cooldown_value: number) {
			try {
				//@ts-ignore
				this.skills[skill_index].onUse(cooldown_value);
			}
			catch(e) {
				console.error(e);
			}
		}

		onSkillStopped(skill_index: number) {
			try {
				//@ts-ignore
				this.skills[skill_index].onStop();
			}
			catch(e) {
				console.error(e);
			}
		}

		assignPlayerPreview(player_index: number, ship_type: number, color_index: number) {
			try {
				let texture_name = Objects.Player.entityName(
					ship_type, Colors.PLAYERS_COLORS[color_index] );
				this.players_infos[player_index].ship_preview_widget.addChild(
					//@ts-ignore
					$$.create('IMG').setAttrib( 'src', ASSETS.getTexture(texture_name).toDataURL() )
				).addChild(
					$$.create('SPAN').addClass('color_stain').setStyle({
						'backgroundColor': Colors.PLAYERS_COLORS[color_index].hex
					})
				);
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerHpChange(player_index: number, hp_value: number) {
			try {
				this.players_infos[player_index].health_widget
					.setStyle( {'width': GameGUI.toPercent(hp_value)} );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerEnergyChange(player_index: number, energy_value: number) {
			try {
				this.players_infos[player_index].energy_widget
					.setStyle( {'width': GameGUI.toPercent(energy_value)} );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerPointsChange(player_index: number, points_value: number) {
			try {
				this.players_infos[player_index].points_widget.setText( points_value );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerKill(player_index: number) {
			try {
				let widget = this.players_infos[player_index].kills_widget;
				widget.setText( parseInt(widget.innerHTML) + 1 );
			}
			catch(e) {
				console.error(e);
			}
		}

		onPlayerDeath(player_index: number) {
			try {
				let widget = this.players_infos[player_index].deaths_widget;
				widget.setText( parseInt(widget.innerHTML) + 1 );
			}
			catch(e) {
				console.error(e);
			}
		}

		update(focused: any, delta: number) {
			if(Device.info.is_mobile) {
				// mobile_speed_state
				let percent = GameGUI.toPercent(this.mobile_speed_state);
				this.focused_speed.setText( percent ).setStyle( {'width': percent} );

				var speed_normalized = focused.movement.speed / focused.movement.maxSpeed;
				if(Math.abs(speed_normalized - this.mobile_speed_state) > 0.05) {
					if(this.on_speed_change_listener) {
						if(this.mobile_speed_state > speed_normalized && 
							focused.movement.isFlagEnabled(Movement.FLAGS.UP) === false)
								this.on_speed_change_listener(TurnDirection.UP)
						else if(this.mobile_speed_state < speed_normalized && 
							focused.movement.isFlagEnabled(Movement.FLAGS.DOWN) === false) 
								this.on_speed_change_listener(TurnDirection.DOWN)
					}
				}
				else if(focused.movement.isFlagEnabled(Movement.FLAGS.UP) || 
					focused.movement.isFlagEnabled(Movement.FLAGS.DOWN)) {

					if(this.on_speed_change_listener) {
						console.log('STOP');
						this.on_speed_change_listener(TurnDirection.NONE);
					}
				}
			}
			else if(this.focused_speed_value !== focused.movement.speed) {
				this.focused_speed_value = focused.movement.speed;

				var speed_normalized = focused.movement.speed / focused.movement.maxSpeed;
				let percent = GameGUI.toPercent(speed_normalized);
				this.focused_speed.setText( percent ).setStyle( {'width': percent} );
			}
			if(this.focused_hp_value !== focused.hp) {
				this.focused_hp_value = focused.hp;

				let percent = GameGUI.toPercent(focused.hp);
				//console.log( percent, focused.hp, focused );
				this.focused_health.setText( percent ).setStyle( {'width': percent} );
			}
			if(this.focused_energy_value !== focused.energy) {
				this.focused_energy_value = focused.energy;

				let percent = GameGUI.toPercent(focused.energy);
				this.focused_energy.setText( percent ).setStyle( {'width': percent} );
			}

			for(var s_i=0; s_i<this.skills.length; s_i++) {
				if(this.skills[s_i] !== null) {
					//@ts-ignore
					this.skills[s_i].update(delta);
				}
			}
		}
	}
}