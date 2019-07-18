import RoomInfo, {GAME_MODES} from '../../common/room_info';
import GameCore, {InitDataSchema} from '../../common/game/game_core';
import Colors from '../../common/game/common/colors';
import Vector, {Vec2f} from '../../common/utils/vector';
import Item, {ITEM_TYPES} from '../../common/game/objects/item';
import PoisonousEnemy  from '../../common/game/objects/poisonous_enemy';
import Bullet, {BULLET_TYPE} from '../../common/game/objects/bullet';
import Bomb from '../../common/game/objects/bomb';
import Skills, {SkillObject} from '../../common/game/common/skills';
import {AVAILABLE_EFFECTS} from '../../common/game/common/effects';
import GameResult from '../../common/game/game_result';
import NetworkCodes from '../../common/network_codes';
import Player from '../../common/game/objects/player';
import Object2D from '../../common/game/objects/object2d';
import Enemy from '../../common/game/objects/enemy';
import EnemySpawner from '../../common/game/objects/enemy_spawner';

import {MapJSON_I} from '../../common/game/maps';
import Config from '../../common/config';

const H_PI = Math.PI/2;
const fixAngle = (a: number) => -a + H_PI;
const pow = (n: number) => n*n;

const SYNC_EVERY_N_FRAMES = 30;//(240)//synchronize roughly each N/60 second

//game constants
const ENEMY_WAVES_FREQUENCY = 5;//spawn new enemies each n seconds
const FIRST_ENEMY_WAVE_DELAY = Config.ROUND_START_DELAY + 3;//seconds to first enemy wave
const ENEMIES_PER_WAVE = 10, MAXIMUM_ENEMIES = 200, MAXIMUM_COMPETITION_ENEMIES = 100;
//TODO: make a variable from MAXIMUM_ENEMIES and allow room's owner to change it within room settings
//200 should be max

const ITEM_SPAWN_FREQUENCY = 0.2;//changed from 0.5 (04.09.2018)

const RESPAWN_DURATION = 3;//seconds

//game logic variables
let wave_i: number, chunk_it: number, chunk_ref, ss_i: number, obj_i: number,
	p_i: number, e_i: number, s_i: number, b_i: number, s_h, 
	async_p_i: number, p_it: Player, b_arr: Bullet[],
	async_p_it: Player, async_s, 
	r_p_i: number,//e_h, e_h2
	hit_x: number, hit_y: number, sin: number, cos: number, synch_array;

let emitAction = (action: number, data?: any) => {
	try {
		//@ts-ignore
		process.send( {action: action, data: data} );
	}
	catch(e) {
		console.error('cannot send message from child process');
	}
};

const runLoop = (function() {
	const TIME_PRECISION = 1e9;
	
	const frame_rate = TIME_PRECISION / 60;
	const FIXED_DELTA = frame_rate;//0.0166666667;// 1/60th of second

	//timing variables
	let hrtime: number[], _dt = 0, _steps_: number, start: number, end: number, delta_sum = 0;

	const nano = function() {
		hrtime = process.hrtime();
		return (+hrtime[0]) * 1e9 + (+hrtime[1]);
	};

	return function(self: ServerGame) {
		function loop() {
			if(!self.running)
				return;
			start = nano();

			delta_sum += _dt;// / TIME_PRECISION;
			_steps_ = 0;
			while(delta_sum >= FIXED_DELTA && _steps_ < 32) {//maximum 32 iterations per frame
				//console.time('server update');
				self.update(FIXED_DELTA / 1e6);
				//console.timeEnd('server update');

				delta_sum -= FIXED_DELTA;
				_steps_++;
			}

			if(_steps_ > 1)//if(_steps_ !== 1)
				console.log('lag:', _steps_);

			end = nano();
			_dt = end - start;
			
			if(_dt < frame_rate) {
				setTimeout(loop, (frame_rate  - _dt) / 1e6);
				_dt = frame_rate;
			}
			else
				setImmediate(loop);
		}
		loop();
	};
})();

interface CollisionsDetector {
	onPlayerPainterCollision: (player: Player, color: Uint8Array) => void;
	onEnemyPainterCollision: (enemy: Enemy, color: Uint8Array) => void;
	onBulletPainterCollision: (bullet: Bullet, color: Uint8Array) => void;
	onPlayerEnemyCollision: (player: Player, enemy: Enemy) => void;
	onPlayerEnemySpawnerCollision: (player: Player, spawner: EnemySpawner) => void;
	onEnemyEnemySpawnerCollision: (enemy: Enemy, spawner: EnemySpawner) => void;
	onPlayerBulletCollision: (player: Player, bullet: Bullet) => void;
	onEnemyBulletCollision: (enemy: Enemy, bullet: Bullet) => void;
	onPlayerItemCollision: (player: Player, item: Item) => void;
}

export default class ServerGame extends GameCore implements CollisionsDetector {
	private room: RoomInfo;
	public running: boolean;
	//private duration: number;
	private readonly maximum_enemies: number;
	private readonly bounceVec: Vec2f;
	private respawning_players: {player: Player, time: number}[] = [];
	private dataForClients: number[] = [];
	public initialized: boolean;

	private time_to_enemy_wave = 0;
	private time_to_item_spawn = 0;
	private wave_number = 0;
	private time_to_spawn = 0;
	private spawn_timestamp = 0;
	private remaining_time = 0;
	private end_timestamp = 0;

	constructor(map: MapJSON_I, room: RoomInfo) {
		super();

		this.room = room;//contains players data

		this.running = false;
		//this.duration = 2674;//any value other than 0

		this.maximum_enemies = 0;

		if(room.gamemode === GAME_MODES.COOPERATION)
			this.maximum_enemies = MAXIMUM_ENEMIES;
		else if(room.gamemode === GAME_MODES.COMPETITION)
			this.maximum_enemies = MAXIMUM_COMPETITION_ENEMIES;

		this.bounceVec = new Vec2f();//buffer object for storing bounce results
		// this.respawning_players = [];

		// this.dataForClients = [];

		try {
			let result = super.loadMap(map);
			if(!result)
				throw new Error('Cannot load map');
		}
		catch(e) {
			console.error(e);
			emitAction( NetworkCodes.START_GAME_FAIL_ACTION );
		}

		this.initialized = true;
	}

	start() {
		console.log('Starting round');

		let init_data: InitDataSchema[] = [];

		let color_id = (Math.random() * Colors.PLAYERS_COLORS.length) | 0;

		for(let sit in this.room.sits) {
			let user_info = this.room.getUserByID( this.room.sits[sit] );
			if(user_info === null)
				continue;
			init_data.push({
				id: user_info.id,
				account_id: user_info.account_id,
				nick: user_info.nick,
				avatar: user_info.avatar,
				level: user_info.level,
				rank: user_info.rank,
				ship_type: user_info.custom_data.ship_type,
				skills: user_info.custom_data.skills,

				color_id: color_id
			});

			color_id = (color_id+1) % Colors.PLAYERS_COLORS.length;
		}

		super.initPlayers( init_data );

		this.time_to_enemy_wave = FIRST_ENEMY_WAVE_DELAY;
		this.time_to_item_spawn = ITEM_SPAWN_FREQUENCY;
		
		this.wave_number = 0;

		this.time_to_spawn = Config.ROUND_START_DELAY;//first players spawning
		this.spawn_timestamp = Date.now() + (this.time_to_spawn * 1000);

		this.remaining_time = this.room.duration || 180;
		this.end_timestamp = Date.now() + (this.remaining_time * 1000);
		
		emitAction(NetworkCodes.START_ROUND_ACTION, {
			game_duration: this.remaining_time, 
			round_delay: Config.ROUND_START_DELAY,
			init_data
		});

		this.running = true;
		runLoop(this);
	}

	end() {
		if(!this.running)
			return;
		this.running = false;
		
		let result = new GameResult(this);

		console.log('Server game finished');
		setTimeout(() => { throw new Error('Game process still exists'); }, 2000);

		//sending results to room users
		emitAction( NetworkCodes.END_GAME_ACTION, {
			result: result.toJSON()
		});
	}

	getPlayerByUserId(id: number) {
		for(async_p_i=0; async_p_i<this.players.length; async_p_i++) {
			//@ts-ignore
			if(this.players[async_p_i].user_id === id)
				return async_p_i;//this.players[async_p_i];
		}
		return -1;
	}

	onClientMessage(client_id: number, data: Uint8Array) {
		if((async_p_i = this.getPlayerByUserId(client_id)) === -1)
			return;
		async_p_it = this.players[async_p_i];

		if((async_p_it).spawning)
			return;

		switch(data[0]) {
			case NetworkCodes.PLAYER_MOVEMENT:
				async_p_it.movement.state = data[1];
				
				//NOTE - this way the action is send immediately
				//no need to wait for next frame of animation
				emitAction( NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32, 
					[NetworkCodes.PLAYER_MOVEMENT_UPDATE, async_p_i, 
						async_p_it.rot, data[1], async_p_it.movement.speed] );
				
				break;
			case NetworkCodes.PLAYER_EMOTICON:
				this.dataForClients.push(NetworkCodes.ON_PLAYER_EMOTICON, async_p_i, data[1]);
				break;
			case NetworkCodes.PLAYER_SKILL_USE_REQUEST://data[1] - skill index
				async_s = async_p_it.skills[ data[1] ];
				if(async_s)
					this.applySkillEffect(async_p_it, async_s, async_p_i, data[1], true);
				break;
			case NetworkCodes.PLAYER_SKILL_STOP_REQUEST:
				async_s = async_p_it.skills[ data[1] ];
				if(async_s) {
					async_s.stopUsing();
					emitAction(NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32, 
						[NetworkCodes.ON_PLAYER_SKILL_CANCEL, async_p_i, data[1]]);
				}
				break;
		}
	}

	//NOTE - this.bounceOutOfColor, not super !!!
	bouncePainter(object: Object2D, color: Uint8Array, bounce_vector: Vector) {
		//@ts-ignore
		return this.bounceOutOfColor(object, color, this, bounce_vector);//returns boolean
	}

	playerBounce(player: Player, color: Uint8Array) {
		if(this.bouncePainter(player, color, this.bounceVec) === true) {
			this.dataForClients.push(NetworkCodes.ON_PLAYER_BOUNCE, this.players.indexOf(player), 
				player.x, player.y, player.rot, this.bounceVec.x, this.bounceVec.y);
			return true;
		}
		return false;
	}

	enemyBounce(enemy: Enemy, color: Uint8Array) {
		if(this.bouncePainter(enemy, color, this.bounceVec) === true) {
			this.dataForClients.push(NetworkCodes.ON_ENEMY_BOUNCE, enemy.id,
				enemy.x, enemy.y, enemy.rot, this.bounceVec.x, this.bounceVec.y);
			enemy.frames_since_last_update = 0;
		}
	}

	bulletBounce(bullet: Bullet, color: Uint8Array) {
		if(this.bouncePainter(bullet, color, this.bounceVec) === true) {
			this.dataForClients.push(NetworkCodes.ON_BULLET_BOUNCE, bullet.id,
				bullet.x, bullet.y, bullet.rot, this.bounceVec.x, this.bounceVec.y);
		}
	}

	onPlayerPainterCollision(player: Player, color: Uint8Array) {
		//ignore self collisions
		if(Colors.compareByteBuffers(player.painter.color.byte_buffer, color))
			return;

		//this.walls_color.byte_buffer
		if(Colors.compareByteBuffers(this.walls_color.byte_buffer, color)) {
			if(player.spawning === true) {//pushing out of safe area and finishing spawning
				this.bounceVec.set(player.x, player.y).normalize().scaleBy(
					GameCore.GET_PARAMS().spawn_radius + GameCore.GET_PARAMS().spawn_walls_thickness);
				player.setPos(this.bounceVec.x, this.bounceVec.y);

				player.spawning = false;
				player.painter.lastPos.set(player.x, player.y);//reset painter position
				player.painter.active = true;

				this.dataForClients.push(NetworkCodes.ON_PLAYER_SPAWNING_FINISH, 
					this.players.indexOf(player), player.x, player.y);
			}
			else
				this.playerBounce(player, color);
		}
		else if(Colors.compareByteBuffers(Colors.POISON.byte_buffer, color)) {
			if(player.effects.isActive( AVAILABLE_EFFECTS.POISONING ) === false) {
				player.effects.active( AVAILABLE_EFFECTS.POISONING );
				this.dataForClients.push(NetworkCodes.ON_PLAYER_POISONED,
					this.players.indexOf(player));
			}
		}
		else if(Colors.isPlayerColor(color)) {//checking collisions with other players curves
			//other painter collisions only in competition mode
			if(this.room.gamemode === GAME_MODES.COMPETITION) {
				for(const player_col_i in Colors.PLAYERS_COLORS) {
					if( Colors.compareByteBuffers(Colors.PLAYERS_COLORS[player_col_i].byte_buffer, color) ) {
						// console.log('You hit other player\'s painter');

						if(this.playerBounce(player, color) === true)
							this.onPlayerEnemyPainterCollision(player);
						
						//	console.log(this.bounceVec);
					}
				}
			}
		}
	}

	onEnemyPainterCollision(enemy: Enemy, color: Uint8Array) {
		if( Colors.compareByteBuffers(this.walls_color.byte_buffer, color) )
			this.enemyBounce(enemy, color);
	}

	onBulletPainterCollision(bullet: Bullet, color: Uint8Array) {
		//ignore self color collision
		if(Colors.compareByteBuffers(bullet.color.byte_buffer, color))
			return;

		if( Colors.compareByteBuffers(this.walls_color.byte_buffer, color) || 
			Colors.compareByteBuffers(Colors.POISON.byte_buffer, color) ||
			Colors.isPlayerColor(color)) 
		{

			if(bullet.type === BULLET_TYPE.BOUNCING) {//bounce bullet if it is a bouncing type
				this.bulletBounce(bullet, color);
			}
			else {//exploding bullet
				hit_x = bullet.x + Math.cos(fixAngle(bullet.rot)) * bullet.width;
				hit_y = bullet.y + Math.sin(fixAngle(bullet.rot)) * bullet.height;

				super.paintHole(hit_x, hit_y, GameCore.GET_PARAMS().bullet_explosion_radius);

				bullet.expired = true;
				
				this.dataForClients.push(NetworkCodes.ON_BULLET_EXPLODE, bullet.id, hit_x, hit_y);
			}
		}
	}

	onPlayerEnemyCollision(player: Player, enemy: Enemy) {
		if(!enemy.isAlive())
			return;
		this.bounceVec.set(player.x - enemy.x, player.y - enemy.y).normalize();

		//directing player outwards explosion center
		player.rot = -Math.atan2( this.bounceVec.y, this.bounceVec.x ) + Math.PI/2.0;
		player.movement.speed = player.movement.maxSpeed;

		if( player.effects.isActive(AVAILABLE_EFFECTS.SHIELD) === false && 
			player.effects.isActive(AVAILABLE_EFFECTS.SPAWN_IMMUNITY) === false ) 
		{
			player.hp -= GameCore.GET_PARAMS().enemy_collision_damage;//ENEMY_COLLISION_DAMAGE;
			player.points -= GameCore.GET_PARAMS().points_lose_for_enemy_collision;
		}

		//do not move player - prevents from jumping outside walls
		//player.x += this.bounceVec.x * GameCore.GET_PARAMS().explosion_radius * 0.5;
		//player.y += this.bounceVec.y * GameCore.GET_PARAMS().explosion_radius * 0.5;

		let xx = player.x - this.bounceVec.x * player.width;
		let yy = player.y - this.bounceVec.y * player.height;
		super.paintHole( xx, yy, GameCore.GET_PARAMS().explosion_radius );

		//enemy dies on hit with player
		enemy.expired = true;

		this.dataForClients.push(NetworkCodes.ON_PLAYER_ENEMY_COLLISION, 
			enemy.id, this.players.indexOf(player), 
			player.x, player.y, player.rot, player.hp, player.points, 
			this.bounceVec.x, this.bounceVec.y);

		if(!player.isAlive())
			this.onPlayerDeath(player, 0);
	}

	onPlayerEnemySpawnerCollision(player: Player, spawner: EnemySpawner) {
		//@ts-ignore
		this.bounceOneObjectFromAnother(player, spawner);

		this.bounceVec.set(player.x - spawner.x, player.y - spawner.y).normalize();

		this.dataForClients.push(NetworkCodes.ON_PLAYER_BOUNCE, this.players.indexOf(player), 
			player.x, player.y, player.rot, this.bounceVec.x, this.bounceVec.y);
	}

	onEnemyEnemySpawnerCollision(enemy: Enemy, spawner: EnemySpawner) {
		//@ts-ignore
		this.bounceOneObjectFromAnother(enemy, spawner);

		this.bounceVec.set(enemy.x - spawner.x, enemy.y - spawner.y).normalize();

		this.dataForClients.push(NetworkCodes.ON_ENEMY_BOUNCE, enemy.id, 
			enemy.x, enemy.y, enemy.rot, this.bounceVec.x, this.bounceVec.y);

		enemy.frames_since_last_update = 0;
	}

	//function created to redundant similar code for players and enemies striked by bullet
	onBulletHit(object: Object2D, bullet: Bullet, is_player: boolean) {
		hit_x = (object.x + bullet.x) / 2.0;
		hit_y = (object.y + bullet.y) / 2.0;

		let damage = 0;
		let dmg_scale = bullet.damage_scale;
		if(is_player) {
			if(bullet.type === BULLET_TYPE.BOUNCING)
				damage = GameCore.GET_PARAMS().player_to_bouncing_bullet_receptivity * dmg_scale;
			else
				damage = GameCore.GET_PARAMS().player_to_bullet_receptivity * dmg_scale;
		
			this.onPlayerAttackedPlayer(<Player>bullet.parent, 
				<Player>object, damage);
		}
		else {
			if(bullet.type === BULLET_TYPE.BOUNCING)
				damage = GameCore.GET_PARAMS().enemy_to_bouncing_bullet_receptivity * dmg_scale;
			else
				damage = GameCore.GET_PARAMS().enemy_to_bullet_receptivity * dmg_scale;

			this.onPlayerAttackedEnemy(<Player>bullet.parent, 
				<Enemy>object, damage);
		}

		this.dataForClients.push( NetworkCodes.ON_BULLET_HIT, bullet.id, hit_x, hit_y );
		bullet.expired = true;
	}

	onPlayerBulletCollision(player: Player, bullet: Bullet) {
		if(!player.isAlive() || bullet.parent === player)
			return;

		this.onBulletHit(player, bullet, true);
	}

	onEnemyBulletCollision(enemy: Enemy, bullet: Bullet) {
		if(!enemy.isAlive())//|| bullet.parent === enemy => TODO when enemy will shoot
			return;

		this.onBulletHit(enemy, bullet, false);
	}

	onPlayerItemCollision(player: Player, item: Item) {
		//console.log(item.type);
		switch(item.type) {
			default: throw new Error('Incorrect item type');
			case ITEM_TYPES.HEALTH:
				if(player.hp >= 0.995)
					return;
				player.hp += Item.HEALTH_VALUE;
				break;
			case ITEM_TYPES.ENERGY:
				if(player.energy >= 0.995)
					return;
				player.energy += Item.ENERGY_VALUE;
				break;
			case ITEM_TYPES.SPEED:
				player.effects.active( AVAILABLE_EFFECTS.SPEED );
				break;
		}

		this.dataForClients.push(NetworkCodes.ON_PLAYER_COLLECT_ITEM, 
			item.id, item.type, this.players.indexOf(player));

		item.expired = true;
	}

	onPlayerEnemyPainterCollision(player: Player) {
		if(player.effects.isActive(AVAILABLE_EFFECTS.SHIELD) === false && 
			player.effects.isActive(AVAILABLE_EFFECTS.SPAWN_IMMUNITY) === false)
		{
			player.points -= GameCore.GET_PARAMS().points_lose_for_enemy_painter_collision;
			player.hp -= GameCore.GET_PARAMS().enemy_painter_collision_damage;
			if(player.hp < 0.01)
				player.hp = 0.01;
		}
		player.movement.speed = player.movement.maxSpeed;

		this.dataForClients.push(NetworkCodes.ON_PLAYER_ENEMY_PAINTER_COLLISION, 
			this.players.indexOf(player), player.x, player.y, player.hp, player.points);

		super.paintHole( player.x, player.y, GameCore.GET_PARAMS().small_explosion_radius );
	}

	onPlayerDeath(player: Player, explosion_radius: number) {
		this.dataForClients.push(NetworkCodes.ON_PLAYER_DEATH, 
			this.players.indexOf(player), RESPAWN_DURATION, player.x, player.y, explosion_radius);

		if(explosion_radius > 0)
			super.paintHole( player.x, player.y, explosion_radius );
		//GameCore.GET_PARAMS().small_explosion_radius

		super.drawDeathMark( player.x, player.y, player.painter.color );

		player.deaths++;
		super.respawnPlayer(player);

		this.respawning_players.push({
			player: player,
			time: RESPAWN_DURATION
		});
	}

	onPlayerAttackedPlayer(attacker: Player, victim: Player, 
		damage: number)
	{
		if(this.room.gamemode !== GAME_MODES.COMPETITION)
			return;

		victim.hp -= damage;//must be before putting data for clients

		this.dataForClients.push(
			NetworkCodes.ON_PLAYER_ATTACKED, 
			this.players.indexOf(attacker), damage,
			this.players.indexOf(victim), victim.hp, victim.x, victim.y
		);

		attacker.points += damage * GameCore.GET_PARAMS().points_for_player_damage;

		if(!victim.isAlive()) {
			this.onPlayerDeath(victim, GameCore.GET_PARAMS().explosion_radius);

			attacker.kills++;
			attacker.points += GameCore.GET_PARAMS().points_for_player_kill;
		}
	}

	onPlayerAttackedEnemy(player: Player, enemy: Enemy, 
		damage: number) 
	{
		enemy.hp_bar.hp -= damage;//must be before putting data for clients

		this.dataForClients.push(
			NetworkCodes.ON_ENEMY_ATTACKED, 
			enemy.id, damage,
			this.players.indexOf(player), enemy.hp_bar.hp, enemy.x, enemy.y
		);

		if(this.room.gamemode === GAME_MODES.COOPERATION)
			player.points += damage * GameCore.GET_PARAMS().points_for_enemy_damage;

		if(!enemy.isAlive()) {//enemy was killed
			enemy.expired = true;
			super.paintHole( enemy.x, enemy.y, GameCore.GET_PARAMS().explosion_radius );
				
			if(this.room.gamemode === GAME_MODES.COOPERATION) {	
				player.kills++;
				player.points += GameCore.GET_PARAMS().points_for_enemy_kill;
			}
		}
		//else {//enemy was hit but not killed (cooperation only)
			//MOVED UP
		//}
	}

	onBombExplosion(bomb: Bomb) {
		super.paintHole( bomb.x, bomb.y, GameCore.GET_PARAMS().bomb_explosion_radius );

		const radius_pow = pow( GameCore.GET_PARAMS().bomb_explosion_radius );
		
		for(e_i=0; e_i<this.enemies.length; e_i++) {
			if(!(<Enemy>this.enemies[e_i]).spawning &&
			Vector.distanceSqrt(this.enemies[e_i], bomb) <= radius_pow) {
				//NOTE - 1.0 == 100% damage
				this.onPlayerAttackedEnemy( bomb.parent, 
					<Enemy>this.enemies[e_i], 1.0);
			}
		}
		if(this.room.gamemode === GAME_MODES.COMPETITION) {
			for(p_i=0; p_i<this.players.length; p_i++) {
				//@ts-ignore
				if(this.players[p_i] !== bomb.parent && !this.players[p_i].spawning &&
				Vector.distanceSqrt(this.players[p_i], bomb) <= radius_pow ) {
					//@ts-ignore //NOTE - 1.0 == 100% damage
					this.onPlayerAttackedPlayer( bomb.parent, this.players[p_i], 1.0);
				}
			}
		}

		this.dataForClients.push(NetworkCodes.ON_BOMB_EXPLODED, bomb.id, bomb.x, bomb.y);
	}

	onStain(enemy: Enemy) {
		let stain_index = GameCore.getRandomStainIndex();
		super.drawStain( stain_index, enemy.x, enemy.y, enemy.width );

		this.dataForClients.push(NetworkCodes.ON_POISON_STAIN, 
			stain_index, enemy.x, enemy.y, enemy.width*GameCore.GET_PARAMS().stain_shrink);
	}

	initWave() {
		//console.log(this.enemies.length);
		if(this.enemies.length < this.maximum_enemies) {
			this.wave_number++;

			this.dataForClients.push(NetworkCodes.WAVE_INFO, this.wave_number);

			for(wave_i=0; wave_i < ENEMIES_PER_WAVE*this.players.length; wave_i++) {
				let enemy_class_index = GameCore.getRandomEnemyClassIndex();
				
				let enemy = super.spawnEnemy( enemy_class_index );
				if(enemy === null)
					continue;
				//console.log(enemy);
				this.dataForClients.push(NetworkCodes.SPAWN_ENEMY, enemy_class_index,
					enemy.id, enemy.x, enemy.y, enemy.rot);

				if(enemy instanceof PoisonousEnemy)
					enemy.onStain(this.onStain.bind(this));
			}
		}
	}

	spawnRandomItem() {
		let item = super.spawnItem( Item.randomType() );
		if(item !== null)
			this.dataForClients.push(NetworkCodes.SPAWN_ITEM, item.id, item.type, item.x, item.y);
	}

	applySkillEffect(player: Player, skill: SkillObject, 
		player_i: number, skill_i: number, immediately_response: boolean) 
	{
		//stopping skill using because player run out of energy or died and is spawning
		if(player.spawning === true || skill.data.energy_cost > player.energy+0.001) {
			skill.stopUsing();
			this.dataForClients.push( NetworkCodes.ON_PLAYER_SKILL_CANCEL, player_i, skill_i );
			return;
		}

		if(skill.cooldown > 0)
			return;

		//applying skill
		switch(skill.data) {
			default: throw new Error('Incorrect skill type');

			//sends back: player_index, number_of_bullets, bullet_id1, pos_x1, pos_y1, rot1, ...
			case Skills.SHOOT1:
			case Skills.SHOOT2:
			case Skills.SHOOT3:
				b_arr = player.shootBullets(skill.data);
				this.bullets.push(...b_arr);

				this.dataForClients.push( NetworkCodes.ON_BULLET_SHOT, player_i, b_arr.length );

				for(let bullet_i of b_arr)//fill rest data for clients
					this.dataForClients.push( bullet_i.id, bullet_i.x, bullet_i.y, bullet_i.rot );
				break;
			case Skills.BOUNCE_SHOT: {
				//BUGFIX - cannot use bounce shot inside poison
				if( player.effects.isActive(AVAILABLE_EFFECTS.POISONING) ) {
					skill.stopUsing();
					this.dataForClients.push(NetworkCodes.ON_PLAYER_SKILL_CANCEL,
						player_i, skill_i);
					return;
				}
				
				sin = Math.sin(-player.rot);
				cos = Math.cos(-player.rot);
				
				let bullet = new Bullet(
					-sin * player.width + player.x,
					cos * player.height + player.y,
					player.rot,
					player,//.painter.color,
					BULLET_TYPE.BOUNCING // bouncing
				);
				this.bullets.push(bullet);
				
				//player_index, bullet_id, pos_x, pos_y, rot
				this.dataForClients.push(NetworkCodes.ON_BOUNCE_BULLET_SHOT, player_i, bullet.id,
					bullet.x, bullet.y, bullet.rot);
			}   break;
			case Skills.ENERGY_BLAST:
				// super.paintHole(player.x, player.y, GameCore.GET_PARAMS().energy_blast_radius);
				this.dataForClients.push( 
					NetworkCodes.ON_ENERGY_BLAST, player.x, player.y, 
					Colors.PLAYERS_COLORS.indexOf(player.painter.color)
				);

				const radius_pow = pow( GameCore.GET_PARAMS().energy_blast_radius );
				
				for(e_i=0; e_i<this.enemies.length; e_i++) {
					//@ts-ignore
					if(!this.enemies[e_i].spawning &&
					Vector.distanceSqrt(this.enemies[e_i], player) <= radius_pow ) {
						this.onPlayerAttackedEnemy(
							player, <Enemy>this.enemies[e_i], 
							GameCore.GET_PARAMS().energy_blast_damage);
					}
				}

				if(this.room.gamemode === GAME_MODES.COMPETITION) {
					for(p_i=0; p_i<this.players.length; p_i++) {
						//@ts-ignore
						if(this.players[p_i] !== player && !this.players[p_i].spawning &&
						Vector.distanceSqrt(this.players[p_i], player) <= radius_pow ) {
							this.onPlayerAttackedPlayer(
								player, <Player>this.players[p_i], 
								GameCore.GET_PARAMS().energy_blast_damage);
						}
					}
				}
				break;
			case Skills.SHIELD:
				player.effects.active( AVAILABLE_EFFECTS.SHIELD );

				//NO NEED TO ADD SHIELD OBJECT SERVER-SIDE BECAUSE IT'S JUST A VISUAL EFFECT
				//player.effects.push( new Effect(Effect.SHIELD) );
				
				this.dataForClients.push( NetworkCodes.ON_SHIELD_EFFECT, player_i );
				break;
			case Skills.SPEED:
				player.effects.active( AVAILABLE_EFFECTS.SPEED );
				this.dataForClients.push( NetworkCodes.ON_SPEED_EFFECT, player_i );
				break;
			case Skills.INSTANT_HEAL:
				player.hp += GameCore.GET_PARAMS().instant_heal_value;
				this.dataForClients.push( NetworkCodes.ON_INSTANT_HEAL, player_i );
				break;
			case Skills.BOMB:
				let bomb = new Bomb(player.x, player.y, player);
				this.bombs.push( bomb );
				
				this.dataForClients.push( NetworkCodes.ON_BOMB_PLACED, player_i, bomb.id, 
					player.x, player.y);
				break;
		}

		player.energy -= skill.use();

		//immediately stop non-continuous skills after it effect is applied
		if( !skill.isContinuous() )
			skill.stopUsing();

		if(immediately_response) {
			emitAction(NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32, 
				[NetworkCodes.ON_PLAYER_SKILL_USE, player_i, 
					skill_i, player.energy]);
		}
		else
			this.dataForClients.push( NetworkCodes.ON_PLAYER_SKILL_USE, player_i, 
				skill_i, player.energy );
	}

	// noinspection SpellCheckingInspection
	updateSpawnings(delta: number) {
		//first time spawning
		if(this.time_to_spawn !== 0) {
			this.time_to_spawn = (this.spawn_timestamp - Date.now()) / 1000;
			if(this.time_to_spawn <= 0) {
				//console.log('SPAWN TIME');
				
				for(p_i=0; p_i<this.players.length; p_i++) {
					p_it = <Player>this.players[p_i];
					p_it.movement.setMaxSpeed();
					this.dataForClients.push(NetworkCodes.PLAYER_MOVEMENT_UPDATE, p_i, 
						p_it.rot, p_it.movement.state, p_it.movement.speed);
				}

				this.time_to_spawn = 0;
			}
		}

		//individual players spawning
		for(r_p_i=0; r_p_i<this.respawning_players.length; r_p_i++) {
			if( (this.respawning_players[r_p_i].time -= delta) <= 0) {//spawning finished
				p_it = this.respawning_players[r_p_i].player;
				p_it.movement.setMaxSpeed();
				this.dataForClients.push(NetworkCodes.PLAYER_MOVEMENT_UPDATE, 
					this.players.indexOf(p_it), 
					p_it.rot, p_it.movement.state, p_it.movement.speed);

				this.dataForClients.push(NetworkCodes.ON_IMMUNITY_EFFECT, 
					this.players.indexOf(p_it));
				p_it.effects.active( AVAILABLE_EFFECTS.SPAWN_IMMUNITY );

				this.respawning_players.splice(r_p_i, 1);
				r_p_i--;
			}
		}
	}

	updateChunks() {
		for(chunk_it=0; chunk_it<this.chunks.length; chunk_it++) {
			chunk_ref = this.chunks[chunk_it];
			if(chunk_ref.need_update) {
				chunk_ref.need_update = false;

				chunk_ref.buff = chunk_ref.ctx.getImageData(0, 0, 
					chunk_ref.canvas.width, chunk_ref.canvas.height);
			}
		}
	}

	//@delta - fixed time in milliseconds
	update(delta: number) {//NOTE - server side delta is fixed
		delta /= 1000.0;

		this.remaining_time = (this.end_timestamp - Date.now())/1000;
		if(this.remaining_time < 0) {
			this.remaining_time = 0;
			this.end();
		}

		//updating timers
		if( (this.time_to_enemy_wave -= delta) < 0) {
			this.time_to_enemy_wave += ENEMY_WAVES_FREQUENCY;
			this.initWave();
		}
		if( (this.time_to_item_spawn -= delta) < 0 ) {
			this.time_to_item_spawn += ITEM_SPAWN_FREQUENCY;
			this.spawnRandomItem();
		}

		this.updateSpawnings(delta);

		this.updateChunks();
		

		//before updating supper class - checking expired bombs
		for(b_i=0; b_i<this.bombs.length; b_i++) {
			if( this.bombs[b_i].expired )//bomb just exploded
				this.onBombExplosion( <Bomb>this.bombs[b_i] );
		}

		super.update(delta);
		//@ts-ignore
		this.detectCollisions(this, this.room.gamemode);

		//synchronize some types of objects
		for(ss_i=0; ss_i<this.server_synchronized.length; ss_i++) {
			synch_array = this.server_synchronized[ss_i];
			for(obj_i=0; obj_i<synch_array.length; obj_i++) {
				if( (++synch_array[obj_i].frames_since_last_update) > SYNC_EVERY_N_FRAMES ) {
					synch_array[obj_i].frames_since_last_update = 0;

					this.dataForClients.push(NetworkCodes.OBJECT_SYNCHRONIZE, 
						synch_array[obj_i].id, ss_i, synch_array[obj_i].x, synch_array[obj_i].y,
						synch_array[obj_i].rot);
				}
			}
		}
		
		for(p_i=0; p_i<this.players.length; p_i++) {//for each player
			p_it = <Player>this.players[p_i];

			//handling skills use
			for(s_i=0; s_i<p_it.skills.length; s_i++) {//for each player skills
				s_h = p_it.skills[s_i];
				if(s_h === null)
					continue;
				if(s_h.isInUse()) {//only for continuous skills
					if(!s_h.isContinuous())
						throw new Error('Non-continuous skill has not been stopped');
					this.applySkillEffect(p_it, s_h, p_i, s_i, false);
				}
			}

			//checking if alive
			if(!p_it.isAlive()) {//dead from poison etc
				this.onPlayerDeath(p_it, GameCore.GET_PARAMS().small_explosion_radius);
			}

			//drawing player line segments for each player
			let segmentLength = Math.hypot(p_it.x-p_it.painter.lastPos.x,
				p_it.y-p_it.painter.lastPos.y);
			//if player moved minimum distance
			if(p_it.painter.active && segmentLength > p_it.width/2.0) {
				super.color = p_it.painter.color.hex;
				
				super.drawLine(p_it.x, p_it.y, p_it.painter.lastPos.x, p_it.painter.lastPos.y, 
					p_it.painter.thickness);
				
				//add player index, player position x and y, player painter last position x and y,
				//player painter thickness
				this.dataForClients.push(NetworkCodes.DRAW_PLAYER_LINE, p_i, p_it.x, p_it.y, 
					p_it.painter.lastPos.x, p_it.painter.lastPos.y);

				p_it.painter.lastPos.x = p_it.x;
				p_it.painter.lastPos.y = p_it.y;
			}
		}

		//after game update - pass data through

		//console.log( Float32Array.from(paintersDataToSend) );
		if(this.dataForClients.length > 0) {//if something was added to array
			emitAction( NetworkCodes.SEND_DATA_TO_CLIENT_ACTION_FLOAT32, this.dataForClients );
			this.dataForClients.length = 0;
		}
	}
}