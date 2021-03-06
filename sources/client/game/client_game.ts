import GameCore, {InitDataSchema} from '../../common/game/game_core';
export {InitDataSchema} from '../../common/game/game_core';
import {Emitter} from './engine/graphics';
import RendererBase from './renderer';
import WebGLRenderer from './webgl_renderer';

import NetworkCodes from '../../common/network_codes';
import {MapJSON_I} from '../../common/game/maps';
import {GAME_MODES} from '../../common/room_info';
import Network from './engine/network';
import Assets from './engine/assets';
import {SOUND_EFFECTS} from "./engine/sound";

//objects
import EntitiesBase from './entities';
import Object2D from '../../common/game/objects/object2d';
import Player from '../../common/game/objects/player';
import Enemy from '../../common/game/objects/enemy';
import EnemySpawner from '../../common/game/objects/enemy_spawner';
import Item, {ITEM_TYPES} from '../../common/game/objects/item';
import Bullet, {BULLET_TYPE} from '../../common/game/objects/bullet';
import Bomb from '../../common/game/objects/bomb';
import Shield from '../../common/game/objects/shield';
import Immunity from '../../common/game/objects/immunity';
import {SkillObject} from '../../common/game/common/skills';
import {MOVEMENT_FLAGS} from '../../common/game/common/movement';
import Colors from '../../common/game/common/colors';
import {EMOTS} from '../../common/game/objects/emoticon';
import {AVAILABLE_EFFECTS} from '../../common/game/common/effects';

//emitters
import HitEmitter from './emitters/hit_emitter';
import ExplosionEmitter from './emitters/explosion_emitter';
import ShadowEmitter from './emitters/shadow_emitter';
import InstantHealEmitter from './emitters/instant_heal_emitter';
import ExperienceEmitter from './emitters/experience_emitter';
import EnergyBlastEmitter from './emitters/energy_blast_emitter';
import {PAINTER_RESOLUTION} from "../../common/game/paint_layer";
import Settings from './engine/settings';
import Vector from "../../common/utils/vector";

function runLoop(self: ClientGame) {
	let last = 0, dt;

	//time measurements
	/*let timer: number, time_samples: number[] = [];
	let timer_log = $$.create('SPAN').html('0ms')
		.setStyle({fontSize: '13px', fontFamily: 'RobotoLight'});
	
	$$(document.body).addChild($$.create('DIV').setStyle({
		'position': 'fixed',
		'left': '0px',
		'bottom': '0px',
		'background': '#0008',
		'color': '#fff',
		'fontSize': '13px',
		'fontFamily': 'RobotoLight'
	}).html('updating + rendering:&nbsp;').addChild(timer_log));*/
	
	const step = function (time: number) {
		dt = time - last;
		last = time;
		
		if (self.running && self.ready) {
			//timer = performance.now();
			self.update(dt);
			
			/*time_samples.push(performance.now() - timer);
			if(time_samples.length >= 120) {
				timer_log.setText((time_samples.reduce( (a, b) => a+b ) / time_samples.length)
					.toFixed(2) + 'ms');
				time_samples = [];
			}*/
			
			requestAnimationFrame(step);
		}
	};
	step(0);
}

let p_h: Player, p_h2: Player, em_i: number,
	s_h_n: SkillObject | null,
	p_i: number, e_i: number, e_h: Enemy,
	b_i: number, i_i: number, b_h: Bullet, obj_i: number, synch_array: Object2D[], rot_dt: number;

export interface ListenersSchema {
	onInitData: (data: InitDataSchema[]) => void;
	onTimerUpdate: (remaining_time: number) => void;
	onEnemiesCountUpdate: (count: number) => void;
	onNotification: (content: string) => void;

	onPlayerHpChange: (index: number, value: number) => void;
	onPlayerEnergyChange: (index: number, value: number) => void;
	onPlayerSpeedChange: (value: number) => void;
	onPlayerPointsChange: (index: number, value: number) => void;
	onPlayerKill: (index: number) => void;
	onPlayerDeath: (index: number) => void;

	addChildEmptySkill: (slot_index: number) => void;
	addChildSkill: (texture_name: string, key: 'space' | number, continuous: boolean) => void;

	onSkillUsed: (index: number, cooldown: number) => void;
	onSkillStopped: (index: number) => void;
}

export default class ClientGame extends GameCore {
	public running = false;
	private destroyed = false;
	public ready = false;

	private readonly gamemode: GAME_MODES;
	private listeners: ListenersSchema;

	//private rendering_mode: number;
	//@ts-ignore
	private renderer: RendererBase;
	//@ts-ignore
	private hit_effects: HitEmitter;

	private emitters?: Emitter[] = undefined;

	private onKeyUp?: (e: Event) => void;
	private onKeyDown?: (e: Event) => void;

	private remaining_time?: number;
	private delay?: number;
	private delay_timestamp?: number;
	private end_timestamp?: number;

	constructor(map: MapJSON_I, _gamemode: GAME_MODES, _listeners: ListenersSchema, 
		onLoad: (result: boolean) => void) 
	{
		super();

		this.gamemode = _gamemode;
		this.listeners = _listeners;
		
		Assets.load();

		Network.assignGameListeners({
			onServerData: this.onServerData.bind(this)
		});

		if( !Assets.loaded() ) {
			setTimeout(() => {
				if(!Assets.loaded()) {
					onLoad(false);
					throw new Error('Waiting for assets to load timed out');
				}
			}, 5000);//maximum waiting for assets to load
		}

		Assets.onload(() => {//making sure game assets are loaded
			if(this.destroyed === true)
				return;

			//if(Settings.canvas_rendering === false)
				this.renderer = new WebGLRenderer(this, map);
			//else
			//	this.renderer = new Renderer.Canvas(this, map);
			
			let res = Settings.getValue('painter_resolution');
			if(res === undefined)
				res = PAINTER_RESOLUTION.MEDIUM;

			let result = super.loadMap(map, res as number);
			if(result !== true)
				throw new Error('Cannot load map');

			//after map loaded
			try {
				if(this.renderer === null)
					return;
				//if(this.renderer instanceof Renderer.Canvas)
				//	(<Renderer.Canvas>this.renderer).onMapLoaded(this);
				this.renderer.draw(0);//draw first frame before waiting for server response
				this.ready = true;
				onLoad(true);
			}
			catch(e) {
				console.error('Cannot initialize renderer: ', e);
				this.running = false;
				onLoad(false);
			}

			//if(Settings.canvas_rendering === false) {
				this.hit_effects = <HitEmitter>WebGLRenderer.addEmitter( new HitEmitter() );
				this.emitters = [this.hit_effects];
			//}
		});
	}

	destroy() {
		console.log('Destroying game');
		super.destroy();
		Network.clearGameListeners();
		this.destroyed = true;
		this.running = false;
		if(this.emitters) {
			//@ts-ignore
			this.hit_effects.expired = true;
			//@ts-ignore
			this.hit_effects = null;
			//@ts-ignore
			this.emitters = null;

		}
		if(this.renderer) {
			this.renderer.destroy();
			//@ts-ignore
			this.renderer = null;
		}
		
		if(this.onKeyUp) window.removeEventListener('keyup', this.onKeyUp, false);
		if(this.onKeyDown) window.removeEventListener('keydown', this.onKeyDown, false);
	}

	private waitForGameToLoad(callback: () => void) {
		if(this.ready)
			callback();
		else {
			setTimeout(() => {
				this.waitForGameToLoad(callback);
			}, 100);
		}
	}

	onServerData(data: Float32Array, index = 0) {
		if(!this.ready) {
			this.waitForGameToLoad(() => {
				this.onServerData(data, index);
			});
			return;
		}
		switch(data[index] | 0) {
			default:
				throw new Error('Received incorrect server data');
			//object_id, sync_array_index, pos_x, pos_y, rot
			case NetworkCodes.OBJECT_SYNCHRONIZE:
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

				//@ts-ignore
				p_h.setPos(data[index + 2], data[index + 3], false);

				index += 4;
				break;
			case NetworkCodes.ON_PLAYER_EMOTICON://player_index, emoticon_id
				p_h = this.players[ data[index + 1] | 0 ];

				p_h.showEmoticon( EMOTS[ data[index + 2] ].file_name );

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

				if( !(data[index + 3] & MOVEMENT_FLAGS.LEFT) && //if player doesn't turn
					!(data[index + 3] & MOVEMENT_FLAGS.RIGHT) ) {

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

				p_h.movement.speed = data[index + 4];
				if(p_h !== this.renderer.focused)//update only different user's player movement state
					p_h.movement.state = data[index + 3];
				//else
				//	this.listeners.onPlayerSpeedChange( p_h.movement.speed / p_h.movement.maxSpeed );

				index += 5;
				break;
			//player_index, player_x, player_y, player_hp, player_points
			case NetworkCodes.ON_PLAYER_ENEMY_PAINTER_COLLISION:
				p_h = this.players[ data[index + 1] | 0 ];

				//p_h.points -= GameCore.GET_PARAMS().points_lose_for_enemy_painter_collision;
				//p_h.hp -= GameCore.GET_PARAMS().enemy_painter_collision_damage;
				//if(p_h.hp < 0.01)
				//	p_h.hp = 0.01;
				p_h.hp = data[index + 4];
				p_h.points = data[index + 5];
				p_h.movement.speed = p_h.movement.maxSpeed;
				//if(p_h === this.renderer.focused)
				//	this.listeners.onPlayerSpeedChange( 1 );

				this.listeners.onPlayerHpChange(data[index + 1], p_h.hp);
				this.listeners.onPlayerPointsChange(data[index + 1], p_h.points);

				this.explosionEffect(data[index + 2], data[index + 3],
					GameCore.GET_PARAMS().small_explosion_radius);

				if(p_h === this.renderer.focused)
					SOUND_EFFECTS.hit.play();

				index += 6;
				break;
			case NetworkCodes.ON_PLAYER_BOUNCE:
				p_h = this.players[ data[index + 1] | 0 ];
				//@ts-ignore
				p_h.setPos(data[index + 2], data[index + 3], false);
				//@ts-ignore
				p_h.setRot(data[index + 4], true);

				//p_h.timestamp = Date.now();

				if(this.hit_effects) {
					this.hit_effects.hit(
						p_h.x - data[index + 5] * p_h.width,
						p_h.y - data[index + 6] * p_h.height, false);
				}

				if(p_h === this.renderer.focused)
					SOUND_EFFECTS.wallHit.play();

				index += 7;
				break;
			case NetworkCodes.ON_ENEMY_BOUNCE:
				for(e_i=0; e_i < this.enemies.length; e_i++) {
					if(this.enemies[e_i].id === (data[index + 1] | 0) ) {
						e_h = this.enemies[e_i];
						e_h.setPos(data[index + 2], data[index + 3]);
						e_h.setRot(data[index + 4]);

						e_h.timestamp = Date.now();
						
						if(this.hit_effects) {
							this.hit_effects.hit(
								e_h.x - data[index + 5] * e_h.width,
								e_h.y - data[index + 6] * e_h.height, false);
						}

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
						
						if(this.hit_effects) {
							this.hit_effects.hit(
								b_h.x - data[index + 5] * b_h.width,
								b_h.y - data[index + 6] * b_h.height, false);
						}

						break;
					}
				}

				index += 7;
				break;
			case NetworkCodes.ON_BULLET_HIT://bullet_id, hit_x, hit_y
				for(b_i=0; b_i < this.bullets.length; b_i++) {
					if( this.bullets[b_i].id === data[index + 1] ) {
						this.bullets[b_i].expired = true;

						if(this.hit_effects)
							this.hit_effects.hit(data[index + 2], data[index + 3], true);
						break;
					}
				}

				index += 4;
				break;
			case NetworkCodes.WAVE_INFO:
				this.listeners.onNotification('Wave ' + data[index + 1]);
				//this.listeners.onNotification('More enemies!');
				index += 2;
				break;
			case NetworkCodes.SPAWN_ENEMY://enemy_class_index, object_id, pos_x, pos_y, rot
				let enemy = new (GameCore.GET_ENEMY_CLASSES())[data[index + 1]]();

				enemy.id = data[index + 2];
				enemy.setPos( data[index + 3], data[index + 4] );
				enemy.setRot( data[index + 5] );

				this.enemies.push( enemy );//add to GameMap objects
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
					data[index + 4]/*, data[index + 5], data[index + 6]*/);

				index += 7;
				break;
			//player_index, number_of_bullets, bullet_id1, pos_x1, pos_y1, rot1, ...
			case NetworkCodes.ON_BULLET_SHOT://NOTE receives data of multiple bullets
				p_h = this.players[ data[index + 1] | 0 ];

				let number_of_bullets = data[index + 2];
				for(let i=0; i<number_of_bullets; i++) {//bullet_id, pos_x, pos_y, rot
					let off = index + 3 + i*4;
					let bullet_s = new Bullet(data[off + 1], data[off + 2], data[off + 3],
						p_h, BULLET_TYPE.NORMAL, EntitiesBase);

					bullet_s.id = data[off];

					this.bullets.push( bullet_s );
				}

				if(p_h === this.renderer.focused)
					SOUND_EFFECTS.shoot.play();

				index += 3 + number_of_bullets * 4;
				break;
			//player_index, bullet_id, pos_x, pos_y, rot
			case NetworkCodes.ON_BOUNCE_BULLET_SHOT://NOTE - only single bullet data
				p_h = this.players[ data[index + 1] | 0 ];

				let bullet = new Bullet(data[index+3], data[index+4], data[index+5],
					p_h, BULLET_TYPE.BOUNCING, EntitiesBase);
				bullet.id = data[index+2];

				this.bullets.push( bullet );

				if(p_h === this.renderer.focused)
					SOUND_EFFECTS.shoot.play();

				index += 6;
				break;
			case NetworkCodes.ON_BOMB_PLACED://player_index, bomb_id, pos_x, pos_y
				p_h = this.players[ data[index + 1] ];

				let bomb = new Bomb( data[index + 3], data[index + 4], p_h );
				bomb.id = data[index + 2];
				bomb.timestamp = Date.now();

				this.bombs.push( bomb );

				index += 5;
				break;
			case NetworkCodes.ON_BOMB_EXPLODED://bomb_id, pos_x, pos_y
				for(b_i=0; b_i<this.bombs.length; b_i++) {//pre expiring bomb for server sync
					if(this.bombs[b_i].id === data[index+1]) {
						this.bombs[b_i].expired = true;
						if(this.renderer.focused) {
							let bomb_dst = Vector.distanceSqrt(this.renderer.focused, this.bombs[b_i]);
							if (bomb_dst < 1)
								SOUND_EFFECTS.explode.play();
						}
					}
				}
				this.explosionEffect(data[index+2], data[index+3],
					GameCore.GET_PARAMS().bomb_explosion_radius);

				index += 4;
				break;
			case NetworkCodes.ON_POISON_STAIN://stain_index, pos_x, pos_y, size
				super.drawStain( data[index + 1], data[index + 2], data[index + 3],
					data[index + 4]*GameCore.GET_PARAMS().stain_shrink );

				index += 5;
				break;
			case NetworkCodes.ON_PLAYER_POISONED://player_index
				p_h = this.players[ data[index + 1] | 0 ];
				p_h.effects.active( AVAILABLE_EFFECTS.POISONING );
				p_h.onPoisoned();

				index += 2;
				break;
			case NetworkCodes.ON_SHIELD_EFFECT://player_index
				p_h = this.players[ data[index + 1] | 0 ];

				p_h.effects.active( AVAILABLE_EFFECTS.SHIELD );

				let shield = new Shield(p_h, AVAILABLE_EFFECTS.SHIELD.duration);
				this.shields.push( shield );

				index += 2;
				break;
			case NetworkCodes.ON_IMMUNITY_EFFECT://player_index
				p_h = this.players[ data[index + 1] | 0 ];

				p_h.effects.active( AVAILABLE_EFFECTS.SPAWN_IMMUNITY );

				let immunity_indicator = new Immunity(p_h, AVAILABLE_EFFECTS.SPAWN_IMMUNITY.duration);
				this.immunities.push( immunity_indicator );

				index += 2;
				break;
			case NetworkCodes.ON_SPEED_EFFECT://player_index
				p_h = this.players[ data[index + 1] | 0 ];
				p_h.effects.active( AVAILABLE_EFFECTS.SPEED );

				index += 2;
				break;
			case NetworkCodes.ON_INSTANT_HEAL:
				p_h = this.players[ data[index + 1] | 0 ];
				p_h.hp += GameCore.GET_PARAMS().instant_heal_value;

				this.listeners.onPlayerHpChange(data[index + 1] | 0, p_h.hp);

				if(this.renderer.withinVisibleArea(p_h.x, p_h.y, 0.5) === true) {
					if(this.emitters) {
						let heal_emitter = new InstantHealEmitter(p_h.x, p_h.y);
						heal_emitter.timestamp = Date.now();
						//if(this.rendering_mode === RENDERING_MODES.WebGL) {
						WebGLRenderer.addEmitter( heal_emitter );
						this.emitters.push( heal_emitter );
						//}
					}

					if(p_h === this.renderer.focused)
						SOUND_EFFECTS.collect.play();
				}

				index += 2;
				break;
			//pos_x, pos_y, player_color_index
			case NetworkCodes.ON_ENERGY_BLAST:
				if(this.renderer.withinVisibleArea(data[index+1], data[index+2],
					GameCore.GET_PARAMS().energy_blast_radius) === true) {
					
					if(this.emitters) {
						let blast_emitter = new EnergyBlastEmitter(data[index+1],data[index+2],
							GameCore.GET_PARAMS().energy_blast_radius,
							Colors.PLAYERS_COLORS[ data[index+3] ]);
						blast_emitter.timestamp = Date.now();

						WebGLRenderer.addEmitter( blast_emitter );
						this.emitters.push( blast_emitter );
					}
					
					// no need to calculate distance to focused player
					// since this function invokes only within visible area
					SOUND_EFFECTS.shoot.play();
				}

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
				//@ts-ignore
				p_h.setPos(data[index + 3], data[index + 4], false);
				//@ts-ignore
				p_h.setRot(data[index + 5], true);
				p_h.hp = data[index + 6];
				p_h.points = data[index + 7];

				this.listeners.onPlayerPointsChange(data[index + 2] | 0, p_h.points);
				this.listeners.onPlayerHpChange(data[index + 2] | 0, p_h.hp);

				p_h.movement.speed = p_h.movement.maxSpeed;
				//if(p_h === this.renderer.focused)
				//	this.listeners.onPlayerSpeedChange( 1 );

				let xx = p_h.x - data[index + 8] * p_h.width;
				let yy = p_h.y - data[index + 9] * p_h.height;

				this.explosionEffect(xx, yy, GameCore.GET_PARAMS().explosion_radius);

				if(p_h === this.renderer.focused)
					SOUND_EFFECTS.hit.play();

				index += 10;
				break;
			case NetworkCodes.ON_BULLET_EXPLODE://bullet_id, hit_x, hit_y
				for(b_i=0; b_i < this.bullets.length; b_i++) {
					if( this.bullets[b_i].id === data[index + 1] )
						this.bullets[b_i].expired = true;
				}
				//console.log(data[index + 2], data[index + 3]);
				super.paintHole(data[index + 2], data[index + 3],
					GameCore.GET_PARAMS().bullet_explosion_radius);
				if(this.hit_effects)
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
					case ITEM_TYPES.HEALTH: {
						p_h.hp += Item.HEALTH_VALUE;
						this.listeners.onPlayerHpChange(data[index + 3] | 0, p_h.hp);

						if(this.renderer.withinVisibleArea(p_h.x, p_h.y, 0.5) === true) {
							if(this.emitters) {
								let heal_emitter = new InstantHealEmitter(p_h.x, p_h.y);
								heal_emitter.timestamp = Date.now();
								
								WebGLRenderer.addEmitter( heal_emitter );
								this.emitters.push( heal_emitter );
							}
						}
					}	break;
					case ITEM_TYPES.ENERGY: {
						p_h.energy += Item.ENERGY_VALUE;
						this.listeners.onPlayerEnergyChange(data[index + 3] | 0, p_h.energy);
					}	break;
					case ITEM_TYPES.SPEED: {
						p_h.effects.active( AVAILABLE_EFFECTS.SPEED );
					}	break;
				}

				index += 4;

				if(p_h === this.renderer.focused)
					SOUND_EFFECTS.collect.play();

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

				this.listeners.onPlayerHpChange(data[index + 1] | 0, p_h.hp);
				this.listeners.onPlayerEnergyChange(data[index + 1] | 0, p_h.hp);

				//player deaths count update
				p_h.deaths++;
				this.listeners.onPlayerDeath( data[index + 1] | 0 );

				if(p_h === this.renderer.focused) {
					this.listeners.onNotification(
						'You died. Respawn in ' + data[index + 2] + ' seconds');

					SOUND_EFFECTS.explode.play();
				}

				index += 6;
				break;
			case NetworkCodes.ON_PLAYER_SKILL_USE://player_index, skill_index, player_energy
				p_h = this.players[ data[index + 1] | 0 ];
				p_h.energy = data[index + 3];

				this.listeners.onPlayerEnergyChange(data[index + 1]|0, p_h.energy);

				s_h_n = p_h.skills[ data[index + 2] | 0 ];
				if(s_h_n !== null) {
					s_h_n.use();

					if(p_h === this.renderer.focused)
						this.listeners.onSkillUsed( data[index + 2]|0, s_h_n.data.cooldown );
				}

				index += 4;
				break;
			case NetworkCodes.ON_PLAYER_SKILL_CANCEL://player_index, skill_index
				p_h = this.players[ data[index + 1] | 0 ];
				s_h_n = p_h.skills[ data[index + 2] | 0 ];
				if(s_h_n !== null)
					s_h_n.stopUsing();

				if(p_h === this.renderer.focused)
					this.listeners.onSkillStopped( data[index + 2] | 0 );

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
	startGame(duration: number, round_delay: number, init_data: InitDataSchema[]) {
		console.log('Starting game (' + duration + '+' + round_delay + ' sec),', init_data);

		if( !this.ready ) {//wait for client to be ready and then start game
			this.waitForGameToLoad(() => {
				this.startGame(duration, round_delay, init_data);
			});
			return;
		}

		try {
			this.listeners.onInitData(init_data);
			super.initPlayers( init_data, EntitiesBase, WebGLRenderer );

			init_data.forEach((data, index) => {
				let curr_room = Network.getCurrentUser();
				if(curr_room === null)
					throw new Error('No room');

				if(data['id'] === curr_room.id) {
					this.renderer.focusOn( this.players[index] );

					//filling skills bar
					for(let s_i=0; s_i<this.players[index].skills.length; s_i++) {
						let sk = this.players[index].skills[s_i];
						if(sk === null) {
							for(let j=s_i+1; j<this.players[index].skills.length; j++) {
								if( this.players[index].skills[j] !== null ) {
									this.listeners.addChildEmptySkill(s_i);
									break;
								}
							}
						}
						else {
							this.listeners.addChildSkill(sk.data.texture_name, 
								s_i === 0 ? 'space' : s_i, sk.isContinuous());
						}
					}
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
		window.addEventListener('keyup', this.onKeyUp, false);
		window.addEventListener('keydown', this.onKeyDown, false);

		this.remaining_time = duration || 180;
		this.end_timestamp = Date.now() + (this.remaining_time * 1000);

		this.delay = round_delay || 0;
		this.delay_timestamp = Date.now() + (this.delay * 1000);

		this.running = true;
		runLoop(this);
	}

	end() {
		this.listeners.onTimerUpdate(0);
		this.running = false;
	}

	onPlayerAttackedPlayer(attacker_i: number, damage: number, victim_i: number, 
		victim_hp: number/*, hit_x: number, hit_y: number*/)
	{
		// if(this.gamemode !== GAME_MODES.COMPETITION)
			// return;
		p_h = this.players[attacker_i];
		p_h2 = this.players[victim_i];

		p_h2.hp = victim_hp;
		this.listeners.onPlayerHpChange(victim_i, p_h2.hp);

		p_h.points += damage * GameCore.GET_PARAMS().points_for_player_damage;
		this.listeners.onPlayerPointsChange(attacker_i, p_h.points);

		if(p_h2.isAlive() === false) {
			//this.onPlayerDeath(p_h2, GameCore.GET_PARAMS().explosion_radius);
			this.onPlayerKilledPlayer(attacker_i, victim_i);

			//p_h.kills++;
			//p_h.points += GameCore.GET_PARAMS().points_for_player_kill;
		}
	}

	onPlayerAttackedEnemy(player_i: number, damage: number, enemy_i: number, 
		enemy_hp: number, hit_x: number, hit_y: number) 
	{
		e_h = this.enemies[enemy_i];

		e_h.hp_bar.hp = enemy_hp;//set up to date enemy's hp value

		if(this.gamemode === GAME_MODES.COOPERATION) {	
			this.players[player_i].points += damage * GameCore.GET_PARAMS().points_for_enemy_damage;
			this.listeners.onPlayerPointsChange(player_i, this.players[player_i].points);
		}

		if(e_h.isAlive() === false) {//enemy died - explosion
			this.explosionEffect(hit_x, hit_y, GameCore.GET_PARAMS().explosion_radius);
			this.onPlayerKilledEnemy( player_i, enemy_i );
			
			e_h.expired = true;//safe removing (after processed by other methods)
		}
	}

	onPlayerKill(attacker_i: number, notification: string, gamemode: GAME_MODES, 
		points_for_kill: number, victim_obj: Object2D) 
	{
		if(this.renderer.focused === this.players[attacker_i])
			this.listeners.onNotification(notification);

		if(this.gamemode === gamemode) {
			this.players[attacker_i].kills++;
			this.players[attacker_i].points += points_for_kill;

			this.listeners.onPlayerKill( attacker_i );
			this.listeners.onPlayerPointsChange(attacker_i, this.players[attacker_i].points);

			if(this.emitters) {
				let exp_effect = new ExperienceEmitter(victim_obj, this.players[attacker_i]);
				exp_effect.timestamp = new Date();

				WebGLRenderer.addEmitter( exp_effect, false );
				this.emitters.push( exp_effect );
			}
		}
	}

	onPlayerKilledPlayer(attacker_i: number, victim_i: number) {
		this.onPlayerKill(attacker_i, 'Player killed', GAME_MODES.COMPETITION,
			GameCore.GET_PARAMS().points_for_player_kill, this.players[victim_i]);
	}

	onPlayerKilledEnemy(player_i: number, enemy_i: number) {
		this.onPlayerKill(player_i, 'Enemy killed', GAME_MODES.COOPERATION,
			GameCore.GET_PARAMS().points_for_enemy_kill, this.enemies[enemy_i]);
	}

	trySkillUse(index: number) {
		let focused = this.renderer.focused;
		if( !focused || focused.spawning )
			return;
		s_h_n = focused.skills[index];
		if(s_h_n && s_h_n.canBeUsed(focused.energy)) {
			Network.sendByteBuffer(Uint8Array.from(
				[NetworkCodes.PLAYER_SKILL_USE_REQUEST, index]));
		}
	}

	trySkillStop(index: number) {
		let focused = this.renderer.focused;
		if( !focused || focused.spawning )
			return;
		s_h_n = focused.skills[index];
		if(s_h_n !== null && s_h_n.isContinuous()) {
			Network.sendByteBuffer(Uint8Array.from(
				[NetworkCodes.PLAYER_SKILL_STOP_REQUEST, Number(index)]));
		}
	}

	tryEmoticonUse(index: number) {
		if( !this.renderer.focused || this.renderer.focused.spawning )
			return;
		Network.sendByteBuffer(Uint8Array.from(
			[NetworkCodes.PLAYER_EMOTICON, index]
		));
	}
	
	public controlPlayer(dir: MOVEMENT_FLAGS, pressed: boolean) {
		let focused = this.renderer.focused;
		if(focused === null || focused.spawning === true)
			return;
		
		let preserved_state = focused.movement.state;
		focused.movement.set( dir, pressed );
		
		if(preserved_state !== focused.movement.state) {
			focused.movement.smooth = false;
			Network.sendByteBuffer(Uint8Array.from(
				[NetworkCodes.PLAYER_MOVEMENT, focused.movement.state]));
		}
	}

	onKey(event: KeyboardEvent, pressed: boolean) {
		let focused = this.renderer.focused;
		if(focused === null || focused.spawning === true)
			return;

		let preserved_state = focused.movement.state;
		if(event.key === 'a' || event.key === 'ArrowLeft')//left
			focused.movement.set( MOVEMENT_FLAGS.LEFT, pressed );
		else if(event.key === 'd' || event.key === 'ArrowRight')//right
			focused.movement.set( MOVEMENT_FLAGS.RIGHT, pressed );
		else if(event.key === 'w' || event.key === 'ArrowUp')//up
			focused.movement.set( MOVEMENT_FLAGS.UP, pressed );
		else if(event.key === 's' || event.key === 'ArrowDown')//down
			focused.movement.set( MOVEMENT_FLAGS.DOWN, pressed );
		else if(event.key === ' ') {//space
			if(pressed)
				this.trySkillUse(0);
			else//stop using skill (continuous skills must be stopped by key release)
				this.trySkillStop(0);
		}
		else if( !isNaN(Number(event.key)) ) {
			let skill_code = parseInt(event.key);
			if(skill_code > 0 && skill_code < focused.skills.length) {//normal skill
				if(pressed)
					this.trySkillUse( skill_code);//key1 == 49 <==> (code-49+1) == 1
				else
					this.trySkillStop(skill_code);
			}
		}
		else if(pressed) {
			for(em_i=0; em_i < EMOTS.length; em_i++) {
				if (EMOTS[em_i].key.toLowerCase() === event.key)
					this.tryEmoticonUse(em_i);
			}
		}

		//any letter (emoticons use)
		/*if(pressed && code >= 65 && code <= 90) {
			EMOTS.forEach((emot, index) => {
				if(emot.key.charCodeAt(0) === code)
					this.tryEmoticonUse(index);
			});
		}*/

		if(preserved_state !== focused.movement.state) {
			focused.movement.smooth = false;
			Network.sendByteBuffer(Uint8Array.from(
				[NetworkCodes.PLAYER_MOVEMENT, focused.movement.state]));
		}
	}

	explosionEffect(x: number, y: number, radius: number) {
		if(this.renderer.withinVisibleArea(x, y, radius) === true && this.emitters) {
			let explosion = new ExplosionEmitter(x, y, radius);
			explosion.timestamp = new Date();
			
			WebGLRenderer.addEmitter( explosion, true );
			this.emitters.push( explosion );
		}

		if(this.emitters) {
			let explosion_shadow = new ShadowEmitter(x, y, radius);
			explosion_shadow.timestamp = new Date();
			WebGLRenderer.addEmitter( explosion_shadow );

			this.emitters.push( explosion_shadow );
		}

		super.paintHole(x, y, radius);
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
			this.listeners.onTimerUpdate( this.remaining_time );
		}

		if(this.delay !== 0) {
			//@ts-ignore
			if( this.delay > 
				//@ts-ignore
					(this.delay = (((this.delay_timestamp - Date.now())/1000)|0)) ) {
				if(this.delay <= 0) {
					this.delay = 0;
					this.listeners.onNotification('GO!!!');
				}
				else
					this.listeners.onNotification('Start in ' + this.delay + '...');
			}
		}

		if(this.renderer.focused) {
			this.listeners.onPlayerSpeedChange( 
				this.renderer.focused.movement.speed / this.renderer.focused.movement.maxSpeed );
		}

		if(delta > 0.5) {//lag occurred or page refocused - update using timestamps
			//delta = 0.1;//1 / 10
			//console.log('update using timestamps');

			super.updateTimestamps(delta);

			let timestamp = Date.now();

			if(this.emitters) {
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
		}
		else {//regular delta update
			super.update(delta);

			for(p_i=0; p_i<this.players.length; p_i++) {
				if( this.players[p_i].effects.isActive(AVAILABLE_EFFECTS.POISONING) )
					this.listeners.onPlayerHpChange(p_i, this.players[p_i].hp);
			}

			if(this.emitters) {
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
		}
		this.listeners.onEnemiesCountUpdate(this.enemies.length);

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
}