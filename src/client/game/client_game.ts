///<reference path="entities.ts"/>
///<reference path="renderer.ts"/>

///<reference path="emitters/hit_emitter.ts"/>
///<reference path="emitters/explosion_emitter.ts"/>

///<reference path="emitters/energy_blast_emitter.ts"/>
///<reference path="emitters/experience_emitter.ts"/>
///<reference path="emitters/fussion_emitter.ts"/>
///<reference path="emitters/instant_heal_emitter.ts"/>
///<reference path="emitters/player_emitter.ts"/>
///<reference path="emitters/poisoning_emitter.ts"/>
///<reference path="emitters/shadow_emitter.ts"/>
///<reference path="emitters/spawner_emitter.ts"/>

///<reference path="../../include/game/game_core.ts"/>
///<reference path="../../include/game/maps.ts"/>

///<reference path="../../include/game/common/effects.ts"/>
///<reference path="../../include/game/common/skills.ts"/>

//const ClientGame = (function() {
namespace ClientGame {
	function runLoop(self: Game) {
		let last = 0, dt;

		//time measurments
		let timer: number, time_samples: number[] = [];
		let timer_log = $$.create('SPAN').html('0ms')
			.setStyle({fontSize: '13px', fontFamily: 'RobotoLight'});
		
		$$(document.body).addChild($$.create('DIV').setStyle({
			position: 'fixed',
			left: '0px',
			bottom: '0px',
			background: '#0008',
			color: '#fff',
			fontSize: '13px',
			fontFamily: 'RobotoLight'
		}).html('updating + rendering:&nbsp;').addChild(timer_log));

		var step = function(time: number) {
			dt = time - last;
			last = time;

			if(self.running) {
				timer = performance.now();
				self.update(dt);
				
				time_samples.push(performance.now() - timer);
				if(time_samples.length >= 120) {
					timer_log.setText((time_samples.reduce( (a, b) => a+b ) / time_samples.length)
						.toFixed(2) + 'ms');
					time_samples = [];
				}

				//@ts-ignore
				window.requestAnimFrame(step);
			}
		};
		step(0);
	}

	//TODO - p_h => Player type, e_h => Enemy type, b_h =>...
	var code: number, p_h: any, p_h2: any, s_h: SkillsScope.SkillObject, 
		p_i: number, e_i: number, b_i: number, i_i: number, 
		e_h: any, b_h: any, obj_i: number, 
		synch_array: Object2D[], rot_dt: number;

	export class Game extends GameCore {
		public running = false;
		private room: RoomInfo;
		private destroyed = false;

		private renderer: Renderer.Class;//Renderer;
		private hit_effects: Emitters.Hit;//HitEmitter;

		private emitters: GRAPHICS.Emitter[];

		private onKeyUp?: (e: Event) => void;
		private onKeyDown?: (e: Event) => void;

		private remaining_time?: number;
		private delay?: number;
		private delay_timestamp?: number;
		private end_timestamp?: number;

		constructor(map: MapJSON_I, onLoad: (result: boolean) => void) {
			super();

			//if(!map.data)
			//	throw "No map data";

			Network.assignCurrentGameHandle(this);
			var curr_room = Network.getCurrentRoom();
			if(curr_room === null)
				throw "Cannot start game not being in room";
				
			this.room = curr_room;

			this.renderer = new Renderer.Class(this, map);

			ASSETS.onload(() => {//making sure game assets are loaded
				if(this.destroyed === true)
					return;
				// this.renderer = new Renderer.Class(this);

				let result = super.loadMap(map);
				if(result !== true)
					throw new Error('Cannot load map');

				//after map loaded
				try {
					if(this.renderer === null/* || this.destroyed === true*/)
						return;

					// this.running = true;
					// runLoop(this);
					this.renderer.draw(0);//draw first frame before waiting for server response
					
					onLoad(true);
				}
				catch(e) {
					console.error('Cannot initialize renderer: ', e);
					this.running = false;
					onLoad(false);
				}
			});

			//this.bounceVec = new Vector.Vec2f();//buffer object for storing bounce results
			this.hit_effects = <Emitters.Hit>Renderer.Class.addEmitter( new Emitters.Hit() );
			this.emitters = [this.hit_effects];

			setTimeout(() => {
				if(!ASSETS.loaded())
					throw new Error('Waiting for assets to load timed out');
			}, 5000);//maximum waiting for assets to load
		}

		destroy() {
			super.destroy();
			this.destroyed = true;
			this.running = false;
			this.hit_effects.expired = true;
			//@ts-ignore
			this.hit_effects = null;
			//@ts-ignore
			this.emitters = null;
			if(this.renderer) {
				this.renderer.destroy();
				//@ts-ignore
				this.renderer = null;
			}

			if(this.onKeyDown)	$$(window).off('keydown', this.onKeyDown);
			if(this.onKeyUp)	$$(window).off('keyup', this.onKeyUp);

			Network.removeCurrentGameHandle();
		}

		onServerData(data: Float32Array, index = 0) {
			
			//index = index || 0;

			switch(data[index] | 0) {
				default:
					throw new Error('Received incorrect server data');
				case NetworkCodes.OBJECT_SYNCHRONIZE://object_id, sync_array_index, pos_x, pos_y, rot
					synch_array = this.server_synchronized[ data[index+2] ];

					for(obj_i=0; obj_i<synch_array.length; obj_i++) {
						if( synch_array[obj_i].id === data[index+1] ) {
							synch_array[obj_i].setPos( data[index+3], data[index+4] );
							synch_array[obj_i].setRot( data[index+5] );
						}
					}

					index += 6;
					break;
				case NetworkCodes.ON_PLAYER_SPAWNING_FINISH:
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.spawning = false;
					p_h.painter.lastPos.set(p_h.x, p_h.y);//reset painter position
					p_h.painter.active = true;

					p_h.setPos(data[index + 2], data[index + 3], false);

					index += 4;
					break;
				case NetworkCodes.ON_PLAYER_EMOTICON://player_index, emoticon_id
					p_h = this.players[ data[index + 1] | 0 ];

					p_h.showEmoticon( InGameGUI.EMOTS[ data[index + 2] ].file_name );

					index += 3;
					break;
				case NetworkCodes.DRAW_PLAYER_LINE://NOTE - use for update player position
					
					p_h = this.players[ data[index + 1] | 0 ];
					this.color = p_h.painter.color.hex;

					p_h.setPos(data[index + 2], p_h.y = data[index + 3]);

					p_h.painter.lastPos.x = data[index + 4];
					p_h.painter.lastPos.y = data[index + 5];
				
					super.drawLine(p_h.x, p_h.y, p_h.painter.lastPos.x, p_h.painter.lastPos.y, 
						p_h.painter.thickness);

					index += 6;
					break;
				case NetworkCodes.PLAYER_MOVEMENT_UPDATE:
					//console.log(data);
					p_h = this.players[ data[index + 1] | 0 ];
					//p_h.setPos(data[index + 2], data[index + 3]);

					if( !(data[index + 3] & Movement.FLAGS.LEFT) && //if player doesn't turn
						!(data[index + 3] & Movement.FLAGS.RIGHT) ) {

						p_h.setRot( data[index + 2] );
						p_h.movement.smooth = true;
					}
					else {
						rot_dt = data[index + 2] - p_h.rot;
						if(rot_dt > Math.PI)
							rot_dt -= Math.PI * 2.0;
						else if(rot_dt < -Math.PI)
							rot_dt += Math.PI * 2.0;
						p_h.setRot( p_h.rot + rot_dt * 0.125 );
					}

					if(p_h !== this.renderer.focused)//update only different user's player
						p_h.movement.state = data[index + 3];

					p_h.movement.speed = data[index + 4];

					index += 5;
					break;
				//player_index, player_x, player_y, player_hp, player_points
				case NetworkCodes.ON_PLAYER_ENEMY_PAINTER_COLLISION:
					p_h = this.players[ data[index + 1] | 0 ];

					/*p_h.points -= GameCore.PARAMS.points_lose_for_enemy_painter_collision;
					p_h.hp -= GameCore.PARAMS.enemy_painter_collision_damage;
					if(p_h.hp < 0.01)
						p_h.hp = 0.01;*/
					p_h.hp = data[index + 4];
					p_h.points = data[index + 5];
					p_h.movement.speed = p_h.movement.maxSpeed;

					this.renderer.GUI.onPlayerHpChange(data[index + 1], p_h.hp);
					this.renderer.GUI.onPlayerPointsChange(data[index + 1], p_h.points);

					this.explosionEffect(data[index + 2], data[index + 3], 
						GameCore.PARAMS.small_explosion_radius);

					index += 6;
					break;
				case NetworkCodes.ON_PLAYER_BOUNCE:
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.setPos(data[index + 2], data[index + 3], false);
					p_h.setRot(data[index + 4], true);

					//p_h.timestamp = Date.now();

					this.hit_effects.hit(
						p_h.x - data[index + 5] * p_h.width, 
						p_h.y - data[index + 6] * p_h.height, false);

					index += 7;
					break;
				case NetworkCodes.ON_ENEMY_BOUNCE:
					for(e_i=0; e_i < this.enemies.length; e_i++) {
						if(this.enemies[e_i].id === (data[index + 1] | 0) ) {
							e_h = this.enemies[e_i];
							e_h.setPos(data[index + 2], data[index + 3]);
							e_h.setRot(data[index + 4]);

							e_h.timestamp = Date.now();
							
							this.hit_effects.hit(
								e_h.x - data[index + 5] * e_h.width, 
								e_h.y - data[index + 6] * e_h.height, false);

							break;
						}
					}

					index += 7;
					break;
				case NetworkCodes.ON_BULLET_BOUNCE://bullet_id, pos_x, pos_y, rot, hit_x, hit_y
					for(b_i=0; b_i < this.bullets.length; b_i++) {
						if(this.bullets[b_i].id === (data[index + 1] | 0) ) {
							b_h = this.bullets[b_i];
							b_h.setPos(data[index + 2], data[index + 3]);
							b_h.setRot(data[index + 4]);

							b_h.timestamp = Date.now();
							
							this.hit_effects.hit(
								b_h.x - data[index + 5] * b_h.width, 
								b_h.y - data[index + 6] * b_h.height, false);

							break;
						}
					}

					index += 7;
					break;
				case NetworkCodes.ON_BULLET_HIT://bullet_id, hit_x, hit_y
					for(b_i=0; b_i < this.bullets.length; b_i++) {
						if( this.bullets[b_i].id === data[index + 1] ) {
							this.bullets[b_i].expired = true;

							this.hit_effects.hit(data[index + 2], data[index + 3], true);
							break;
						}
					}

					index += 4;
					break;
				case NetworkCodes.WAVE_INFO:
					// this.renderer.GUI.addNotification('Wave ' + data[index + 1]);
					this.renderer.GUI.addNotification('More enemies!');
					index += 2;
					break;
				case NetworkCodes.SPAWN_ENEMY://enemy_class_index, object_id, pos_x, pos_y, rot
					let enemy = new GameCore.ENEMY_CLASSES[data[index + 1]]();//new RocketEnemy();

					enemy.id = data[index + 2];
					enemy.setPos( data[index + 3], data[index + 4] );
					enemy.setRot( data[index + 5] );

					this.enemies.push( <Object2D>enemy );//add to GameMap objects

					this.enemy_spawners.push( new EnemySpawner(enemy) );

					index += 6;

					//console.log(enemy);
					break;
				case NetworkCodes.SPAWN_ITEM://item_id, item_type, item_x, item_y
					let item = new Item( data[index + 2] );

					item.id = data[index + 1];
					item.setPos( data[index + 3], data[index + 4] );
					item.timestamp = Date.now();

					this.items.push( item );

					index += 5;

					break;

				//enemy_id, damage, player_index, new_enemy_hp, hit_x, hit_y
				case NetworkCodes.ON_ENEMY_ATTACKED:
					for(e_i=0; e_i < this.enemies.length; e_i++) {
						if( this.enemies[e_i].id === (data[index + 1] | 0) ) {
							//player_index, damage, enemy_index, enemy_hp, hit_x, hit_y
							this.onPlayerAttackedEnemy(
								data[index+3], data[index+2], e_i, data[index+4],
								data[index + 5], data[index + 6]
							);

							break;
						}
					}

					index += 7;
					break;
				//attacker_index, damage, victim_index, new_victim_hp, hit_x, hit_y
				case NetworkCodes.ON_PLAYER_ATTACKED://player attacked by player
					this.onPlayerAttackedPlayer(data[index + 1], data[index + 2], data[index + 3], 
						data[index + 4], data[index + 5], data[index + 6]);

					index += 7;
					break;
				//player_index, number_of_bullets, bullet_id1, pos_x1, pos_y1, rot1, ...
				case NetworkCodes.ON_BULLET_SHOT://NOTE receives data of multiple bullets
					p_h = this.players[ data[index + 1] | 0 ];

					let number_of_bullets = data[index + 2];
					for(let i=0; i<number_of_bullets; i++) {//bullet_id, pos_x, pos_y, rot
						let off = index + 3 + i*4;
						let bullet = new Bullet(data[off + 1], data[off + 2], data[off + 3], 
							p_h);

						bullet.id = data[off + 0];

						this.bullets.push( bullet );
					}

					index += 3 + number_of_bullets * 4;
					break;
				//player_index, bullet_id, pos_x, pos_y, rot
				case NetworkCodes.ON_BOUNCE_BULLET_SHOT://NOTE - only single bullet data
					p_h = this.players[ data[index + 1] | 0 ];

					let bullet = new Bullet(data[index + 3], data[index + 4], data[index + 5], 
						p_h, true);
					bullet.id = data[index + 2];

					this.bullets.push( bullet );

					index += 6;
					break;
				case NetworkCodes.ON_BOMB_PLACED://player_index, bomb_id, pos_x, pos_y
					p_h = this.players[ data[index + 1] ];

					let bomb = new Bomb( data[index + 3], data[index + 4], p_h );
					bomb.id = data[index + 2];
					bomb.timestamp = Date.now();

					this.bombs.push( <any>bomb );

					index += 5;
					break;
				case NetworkCodes.ON_BOMB_EXPLODED://bomb_id, pos_x, pos_y
					for(b_i=0; b_i<this.bombs.length; b_i++) {//pre expiring bomb for server sync 
						if(this.bombs[b_i].id === data[index+1])
							this.bombs[b_i].expired = true;
					}
					this.explosionEffect(data[index+2], data[index+3], 
						GameCore.PARAMS.bomb_explosion_radius);

					index += 4;
					break;
				case NetworkCodes.ON_POISON_STAIN://stain_index, pos_x, pos_y, size
					super.drawStain( data[index + 1], data[index + 2], data[index + 3], 
						data[index + 4]*GameCore.PARAMS.stain_shrink );

					index += 5;
					break;
				case NetworkCodes.ON_PLAYER_POISONED://player_index
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.effects.active( Effects.TYPES.POISONING );
					p_h.onPoisoned();

					index += 2;
					break;
				case NetworkCodes.ON_SHIELD_EFFECT://player_index
					p_h = this.players[ data[index + 1] | 0 ];

					p_h.effects.active( Effects.TYPES.SHIELD );

					let shield = new Shield(p_h, Effects.TYPES.SHIELD.duration);
					this.shields.push( shield );

					index += 2;
					break;
				case NetworkCodes.ON_IMMUNITY_EFFECT://player_index
					p_h = this.players[ data[index + 1] | 0 ];

					p_h.effects.active( Effects.TYPES.SPAWN_IMMUNITY );

					let immunity_indicator = new Immunity(p_h, Effects.TYPES.SPAWN_IMMUNITY.duration);
					this.immunities.push( immunity_indicator );

					index += 2;
					break;
				case NetworkCodes.ON_SPEED_EFFECT://player_index
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.effects.active( Effects.TYPES.SPEED );

					index += 2;
					break;
				case NetworkCodes.ON_INSTANT_HEAL:
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.hp += GameCore.PARAMS.instant_heal_value;
					this.renderer.GUI.onPlayerHpChange(data[index + 1] | 0, p_h.hp);

					if(this.renderer.withinVisibleArea(p_h.x, p_h.y, 0.5) === true) {
						//@ts-ignore
						let heal_emitter = new Emitters.InstantHeal(p_h.x, p_h.y);
						heal_emitter.timestamp = Date.now();
						Renderer.Class.addEmitter( heal_emitter );
						this.emitters.push( heal_emitter );
					}

					index += 2;
					break;	
				//pos_x, pos_y, player_color_index
				case NetworkCodes.ON_ENERGY_BLAST:
					if(this.renderer.withinVisibleArea(data[index+1], data[index+2], 
						GameCore.PARAMS.energy_blast_radius) === true) {
						
						//@ts-ignore
						let blast_emitter = new Emitters.EnergyBlast(data[index+1], data[index+2], 
							GameCore.PARAMS.energy_blast_radius, 
							Colors.PLAYERS_COLORS[ data[index+3] ]);
						blast_emitter.timestamp = Date.now();
						
						Renderer.Class.addEmitter( blast_emitter );
						this.emitters.push( blast_emitter );
					}
					//super.paintHole(data[index+1],data[index+2],
					//	GameCore.PARAMS.energy_blast_radius);

					index += 4;
					break;
				//enemy_id, player_index, x, y, player_rot, player_hp, player_points, bounce_x and y
				case NetworkCodes.ON_PLAYER_ENEMY_COLLISION:
					for(e_i=0; e_i < this.enemies.length; e_i++) {
						if( this.enemies[e_i].id === (data[index + 1] | 0) ) {
							this.enemies[e_i].expired = true;
							break;
						}
					}

					p_h = this.players[ data[index + 2] | 0 ];
					p_h.setPos(data[index + 3], data[index + 4], false);
					p_h.setRot(data[index + 5], true);
					p_h.hp = data[index + 6];
					p_h.points = data[index + 7];
					//if(p_h.effects.isActive(Effects.SHIELD) === false && 
					//	p_h.effects.isActive(Effects.SPAWN_IMMUNITY) === false) 
					//{
					//p_h.points -= GameCore.PARAMS.points_lose_for_enemy_collision;
					this.renderer.GUI.onPlayerPointsChange(
						data[index + 2] | 0, p_h.points);
					//}

					this.renderer.GUI.onPlayerHpChange(data[index + 2] | 0, p_h.hp);

					p_h.movement.speed = p_h.movement.maxSpeed;

					var xx = p_h.x - data[index + 8] * p_h.width;
					var yy = p_h.y - data[index + 9] * p_h.height;

					this.explosionEffect(xx, yy, GameCore.PARAMS.explosion_radius);

					index += 10;
					break;
				case NetworkCodes.ON_BULLET_EXPLODE://bullet_id, hit_x, hit_y
					for(b_i=0; b_i < this.bullets.length; b_i++) {
						if( this.bullets[b_i].id === data[index + 1] )
							this.bullets[b_i].expired = true;
					}
					//console.log(data[index + 2], data[index + 3]);
					super.paintHole(data[index + 2], data[index + 3], 
						GameCore.PARAMS.bullet_explosion_radius);
					this.hit_effects.hit(data[index + 2], data[index + 3], false);

					index += 4;
					break;
				case NetworkCodes.ON_PLAYER_COLLECT_ITEM://item_id, item_type, player_index
					for(i_i=0; i_i < this.items.length; i_i++) {
						if( this.items[i_i].id === (data[index + 1] | 0) ) {
							this.items[i_i].expired = true;
							break;
						}
					}

					p_h = this.players[ data[index + 3] | 0 ];

					switch( data[index + 2] | 0 ) {//switch item.type
						case Item.TYPES.HEALTH: {
							p_h.hp += Item.HEALTH_VALUE;
							this.renderer.GUI.onPlayerHpChange(data[index + 3] | 0, p_h.hp);

							if(this.renderer.withinVisibleArea(p_h.x, p_h.y, 0.5) === true) {
								//@ts-ignore
								let heal_emitter = new Emitters.InstantHeal(p_h.x, p_h.y);
								heal_emitter.timestamp = Date.now();
								Renderer.Class.addEmitter( heal_emitter );
								this.emitters.push( heal_emitter );
							}
						}	break;
						case Item.TYPES.ENERGY: {
							p_h.energy += Item.ENERGY_VALUE;
							this.renderer.GUI.onPlayerEnergyChange(data[index + 3] | 0, p_h.energy);
						}	break;
						case Item.TYPES.SPEED: {
							p_h.effects.active( Effects.TYPES.SPEED );
						}	break;
					}

					index += 4;

					break;
				//player_index, spawning_duration death_pos_x and y, explosion_radius
				case NetworkCodes.ON_PLAYER_DEATH:
					p_h = this.players[ data[index + 1] | 0 ];

					if(data[index + 5] > 0) {//explosion radius
						this.explosionEffect(data[index + 3], data[index + 4], 
							data[index + 5]);
					}
					
					super.respawnPlayer(p_h);
					super.drawDeathMark( data[index + 3], data[index + 4], p_h.painter.color );

					this.renderer.GUI.onPlayerHpChange(data[index + 1] | 0, p_h.hp);
					this.renderer.GUI.onPlayerEnergyChange(data[index + 1] | 0, p_h.hp);

					//player deaths count update
					p_h.deaths++;
					this.renderer.GUI.onPlayerDeath( data[index + 1] | 0 );

					if(p_h === this.renderer.focused)
						this.renderer.GUI.addNotification(
							'You died. Respawn in ' + data[index + 2] + ' seconds');

					index += 6;
					break;
				case NetworkCodes.ON_PLAYER_SKILL_USE://player_index, skill_index, player_energy
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.energy = data[index + 3];

					this.renderer.GUI.onPlayerEnergyChange(data[index + 1] | 0, p_h.energy);

					s_h = p_h.skills[ data[index + 2] | 0 ];
					s_h.use();

					if(p_h === this.renderer.focused) {
						this.renderer.GUI.onSkillUsed( data[index + 2] | 0, s_h.data.cooldown );
					}

					index += 4;
					break;
				case NetworkCodes.ON_PLAYER_SKILL_CANCEL://player_index, skill_index
					p_h = this.players[ data[index + 1] | 0 ];
					p_h.skills[ data[index + 2] | 0 ].stopUsing();

					if(p_h === this.renderer.focused) {
						this.renderer.GUI.onSkillStopped( data[index + 2] | 0 );
					}

					index += 3;
					break;
			}

			if(index < data.length) {//if not everything was handled
				if(index === 0)
					throw new Error('Index of server data not incremented after first iteration');
				this.onServerData(data, index);//looping for next data from server
			}
		}

		//@duration, round_delay - number (game duration in seconds), @init_data - array
		startGame(duration: number, round_delay: number, init_data: any[]) {
			console.log('Starting game (' + duration + '+' + round_delay + ' sec),', init_data);

			try {
				super.initPlayers( init_data );

				init_data.forEach((data, index) => {
					this.renderer.GUI.assignPlayerPreview(index, data['ship_type'], data['color_id']);

					var curr_room = Network.getCurrentUser();
					if(curr_room === null)
						throw "No room";	

					if(data['id'] === curr_room.id) {
						this.renderer.focusOn( <any>this.players[index] );

						//filling skills bar
						for(let s_i=0; s_i<this.renderer.focused.skills.length; s_i++) {
							let sk = this.renderer.focused.skills[s_i];
							if(sk === null) {
								for(let j=s_i+1; j<this.renderer.focused.skills.length; j++) {
									if( this.renderer.focused.skills[j] !== null ) {
										this.renderer.GUI.addChildEmptySkill(s_i);
										break;
									}
								}
							}
							else
								this.renderer.GUI.addChildSkill(sk.data.texture_name, 
									s_i === 0 ? 'space' : s_i, sk.isContinous());
						}
					}
				});

				this.renderer.GUI.onEmoticonUse((index: number) => {
					if(this.renderer.focused !== null && this.renderer.focused.spawning !== true)
						this.tryEmoticonUse(index);
				});

				this.renderer.GUI.onSkillUse((index: number | string) => {
					if(this.renderer.focused !== null && this.renderer.focused.spawning !== true)
						this.trySkillUse(typeof index === 'number' ? index : 0);
				});

				this.renderer.GUI.onSkillStop((index: number | string) => {
					if(this.renderer.focused !== null && this.renderer.focused.spawning !== true)
						this.trySkillStop(typeof index === 'number' ? index : 0);
				});

				this.renderer.GUI.onTurnArrowPressed((dir: TurnDirection, released: boolean) => {
					var focused = this.renderer.focused;
					if(focused === null || focused.spawning === true)
						return;

					var preserved_state = focused.movement.state;

					focused.movement.set( dir === TurnDirection.LEFT 
						? Movement.FLAGS.LEFT
						: Movement.FLAGS.RIGHT, !released );

					if(preserved_state != focused.movement.state) {
						focused.movement.smooth = false;
						Network.sendByteBuffer(Uint8Array.from(
							[NetworkCodes.PLAYER_MOVEMENT, focused.movement.state]));
					}
				});

				this.renderer.GUI.onSpeedChange((dir: TurnDirection) => {
					var focused = this.renderer.focused;
					if(focused === null || focused.spawning === true)
						return;

					var preserved_state = focused.movement.state;

					focused.movement.set( Movement.FLAGS.UP, dir === TurnDirection.UP );
					focused.movement.set( Movement.FLAGS.DOWN, dir === TurnDirection.DOWN );

					if(preserved_state != focused.movement.state) {
						focused.movement.smooth = false;
						Network.sendByteBuffer(Uint8Array.from(
							[NetworkCodes.PLAYER_MOVEMENT, focused.movement.state]));
					}
				});
			}
			catch(e) {
				console.error(e);
			}

			//references to class methods preserve for later events detach
			this.onKeyUp 	= (e: Event) => this.onKey(<KeyboardEvent>e, false);
			this.onKeyDown 	= (e: Event) => this.onKey(<KeyboardEvent>e, true);

			//assigning keyboard controls
			$$(window).on('keydown', this.onKeyDown);
			$$(window).on('keyup', this.onKeyUp);

			this.remaining_time = duration || 180;
			this.end_timestamp = Date.now() + (this.remaining_time * 1000);

			this.delay = round_delay || 0;
			this.delay_timestamp = Date.now() + (this.delay * 1000);

			//for(let i=0; i<100; i++)
			//	this.items.push( new Item(Item.randomType(), Math.random(), Math.random()) );
			//super.drawDeathMark( 0.5, 0, Colors.SAFE_AREA );

			this.running = true;
			runLoop(this);
		}

		end() {
			//try {
				this.renderer.GUI.updateTimer( 0 );
				this.running = false;
			//}
			//catch(e) {
			//	console.error(e);
				//TODO - fallback to lobby stage
			//}
		}

		onPlayerAttackedPlayer(attacker_i: number, damage: number, victim_i: number, 
			victim_hp: number, hit_x: number, hit_y: number) 
		{
			// if(this.room.gamemode !== RoomInfo.GAME_MODES.COMPETITION)
				// return;
			p_h = this.players[attacker_i];
			p_h2 = this.players[victim_i];

			p_h2.hp = victim_hp;
			this.renderer.GUI.onPlayerHpChange(victim_i, p_h2.hp);

			p_h.points += damage * GameCore.PARAMS.points_for_player_damage;
			this.renderer.GUI.onPlayerPointsChange(attacker_i, p_h.points);

			if(p_h2.isAlive() === false) {
				//this.onPlayerDeath(p_h2, GameCore.PARAMS.explosion_radius);
				this.onPlayerKilledPlayer(attacker_i, victim_i);

				//p_h.kills++;
				//p_h.points += GameCore.PARAMS.points_for_player_kill;
			}
		}

		onPlayerAttackedEnemy(player_i: number, damage: number, enemy_i: number, 
			enemy_hp: number, hit_x: number, hit_y: number) 
		{
			e_h = this.enemies[enemy_i];

			e_h.hp_bar.hp = enemy_hp;//set up to date enemy's hp value

			if(this.room.gamemode === GAME_MODES.COOPERATION) {	
				(<any>this.players[player_i]).points += 
					damage * GameCore.PARAMS.points_for_enemy_damage;
				this.renderer.GUI.onPlayerPointsChange(player_i, 
					(<any>this.players[player_i]).points);
			}

			if(e_h.isAlive() === false) {//enemy died - exploson
				this.explosionEffect(hit_x, hit_y, GameCore.PARAMS.explosion_radius);
				this.onPlayerKilledEnemy( player_i, enemy_i );
				
				e_h.expired = true;//safe removing (after processed by other methods)
			}
		}

		//redundantion
		onPlayerKill(attacker_i: number, notification: string, gamemode: number, 
			points_for_kill: number, victim_obj: Object2D) 
		{
			if(this.renderer.focused === this.players[attacker_i])
				this.renderer.GUI.addNotification(notification);

			if(this.room.gamemode === gamemode) {
				(<any>this.players[attacker_i]).kills++;
				(<any>this.players[attacker_i]).points += points_for_kill;

				this.renderer.GUI.onPlayerKill( attacker_i );
				this.renderer.GUI.onPlayerPointsChange(attacker_i, 
					(<any>this.players[attacker_i]).points);

				//@ts-ignore
				let exp_effect = new Emitters.Experience(victim_obj, this.players[attacker_i]);
				exp_effect.timestamp = new Date();

				Renderer.Class.addEmitter( exp_effect, false );
				this.emitters.push( exp_effect );
			}
		}

		onPlayerKilledPlayer(attacker_i: number, victim_i: number) {
			this.onPlayerKill(attacker_i, 'Player killed', GAME_MODES.COMPETITION,
				GameCore.PARAMS.points_for_player_kill, this.players[victim_i]);
		}

		onPlayerKilledEnemy(player_i: number, enemy_i: number) {
			this.onPlayerKill(player_i, 'Enemy killed', GAME_MODES.COOPERATION,
				GameCore.PARAMS.points_for_enemy_kill, this.enemies[enemy_i]);
		}

		trySkillUse(index: number) {
			var focused = this.renderer.focused;
			if(focused.skills[index] && focused.skills[index].canBeUsed(focused.energy)) {
				Network.sendByteBuffer(Uint8Array.from(
					[NetworkCodes.PLAYER_SKILL_USE_REQUEST, index]));
			}
		}

		trySkillStop(index: number | string) {
			var focused = this.renderer.focused;
			if(focused.skills[index] && focused.skills[index].isContinous()) {
				Network.sendByteBuffer(Uint8Array.from(
					[NetworkCodes.PLAYER_SKILL_STOP_REQUEST, Number(index)]));
			}
		}

		tryEmoticonUse(index: number) {
			Network.sendByteBuffer(Uint8Array.from(
				[NetworkCodes.PLAYER_EMOTICON, index]
			));
		}

		onKey(event: KeyboardEvent, pressed: boolean) {
			code = event.keyCode;
			var focused = this.renderer.focused;
			if(focused === null || focused.spawning === true)
				return;

			let preserved_state = focused.movement.state;
			if(code === 65 || code === 37)//left
				focused.movement.set( Movement.FLAGS.LEFT, pressed );
			else if(code === 68 || code === 39)//right
				focused.movement.set( Movement.FLAGS.RIGHT, pressed );
			else if(code === 87 || code === 38)//up
				focused.movement.set( Movement.FLAGS.UP, pressed );
			else if(code === 83 || code === 40)//down
				focused.movement.set( Movement.FLAGS.DOWN, pressed );
			else if(code === 32) {//space
				if(pressed)
					this.trySkillUse(0);
				else//stop using skill (continous skills must be stopped by key release)
					this.trySkillStop(0);
			}
			else if(code >= 49 && code < 49 + focused.skills.length - 1) {//normal skill
				if(pressed)
					this.trySkillUse(code - 49 + 1);//key1 == 49 <==> (code-49+1) == 1
				else
					this.trySkillStop(code - 49 + 1);
			}

			//any letter (emoticons use)
			if(pressed && code >= 65 && code <= 90) {
				InGameGUI.EMOTS.forEach((emot, index) => {
					if(emot.key.charCodeAt(0) === code) {
						this.tryEmoticonUse(index);
					}
				});
			}
			//console.log(event, 'A'.charCodeAt(0));

			if(preserved_state != focused.movement.state) {
				focused.movement.smooth = false;
				Network.sendByteBuffer(Uint8Array.from(
					[NetworkCodes.PLAYER_MOVEMENT, focused.movement.state]));
			}
		}

		explosionEffect(x: number, y: number, radius: number) {
			if(this.renderer.withinVisibleArea(x, y, radius) === true) {
				//@ts-ignore
				let explosion = new Emitters.Explosion(x, y, radius);
				explosion.timestamp = new Date();
				Renderer.Class.addEmitter( explosion, true );
				this.emitters.push( explosion );
			}

			//@ts-ignore
			let explosion_shadow = new Emitters.Shadow(x, y, radius);
			explosion_shadow.timestamp = new Date();
			Renderer.Class.addEmitter( explosion_shadow );

			super.paintHole(x, y, radius);

			this.emitters.push( explosion_shadow );
		}

		update(delta: number) {
			delta /= 1000.0;
			//console.log(delta);

			//@ts-ignore
			if( this.remaining_time > 
				//@ts-ignore
					(this.remaining_time = (((this.end_timestamp - Date.now())/1000)|0)) ) {
				if(this.remaining_time < 0)
					this.remaining_time = 0;
				this.renderer.GUI.updateTimer( this.remaining_time );
			}

			if(this.delay !== 0) {
				//@ts-ignore
				if( this.delay > 
					//@ts-ignore
						(this.delay = (((this.delay_timestamp - Date.now())/1000)|0)) ) {
					if(this.delay <= 0) {
						this.delay = 0;
						this.renderer.GUI.addNotification('GO!!!');
					}
					else
						this.renderer.GUI.addNotification('Start in ' + this.delay + '...');
				}
			}

			if(delta > 0.5) {//lag occured or page refocused - update using timestamps
				//delta = 0.1;//1 / 10
				//console.log('update using timestamps');

				super.updateTimestamps(delta);

				var timestamp = Date.now();

				for(e_i=0; e_i<this.emitters.length; e_i++) {
					if(this.emitters[e_i].expired === true) {
						this.emitters.splice(e_i, 1);
						e_i--;
					}
					else if(this.emitters[e_i].timestamp) {
						this.emitters[e_i]
							.update((timestamp - <number>this.emitters[e_i].timestamp)/1000.0);
						this.emitters[e_i].timestamp = 0;
					}
					else//object timestamp === 0
						this.emitters[e_i].update(delta);
				}
			}
			else {//regular delta update
				super.update(delta);

				for(p_i=0; p_i<this.players.length; p_i++) {
					if( (<any>this.players[p_i]).effects.isActive(Effects.TYPES.POISONING) )
						//@ts-ignore
						this.renderer.GUI.onPlayerHpChange(p_i, this.players[p_i].hp);
				}

				//this.hit_effects.update(delta);
				for(e_i=0; e_i<this.emitters.length; e_i++) {
					if(this.emitters[e_i].expired === true) {
						this.emitters.splice(e_i, 1);
						e_i--;
					}
					else {
						this.emitters[e_i].update(delta);
						this.emitters[e_i].timestamp = 0;
					}
				}
			}

			this.renderer.draw(delta);

			//debugging players sensors
			/*super.color = Colors.SAFE_AREA.hex;
			let p = this.players[0];
			if(p) {
				for(let coord of p.sensor.shape) {
					var s = Math.sin(-p.rot);
					var c = Math.cos(-p.rot);

					var xx = (coord[0] * c - coord[1] * s) * p.width + p.x;
					var yy = (coord[0] * s + coord[1] * c) * p.height + p.y;

					super.drawCircle(xx, yy, 0.0025);
				}
			}*/
			//debugging enemies sensors
			/*super.color = Colors.SAFE_AREA.hex;
			for(let en of this.enemies) {
				for(let coord of en.sensor.shape) {
					var s = Math.sin(-en.rot);
					var c = Math.cos(-en.rot);

					var xx = (coord[0] * c - coord[1] * s) * en.width + en.x;
					var yy = (coord[0] * s + coord[1] * c) * en.height + en.y;

					super.drawCircle(xx, yy, 0.0025);
				}
			}*/
		}
	};
}//)();