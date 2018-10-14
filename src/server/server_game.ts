///<reference path="../include/room_info.ts"/>
///<reference path="../include/game/game_core.ts"/>
///<reference path="../include/game/common/colors.ts"/>
///<reference path="../include/utils/vector.ts"/>
///<reference path="../include/game/objects/item.ts"/>
///<reference path="../include/game/objects/poisonous_enemy.ts"/>
///<reference path="../include/game/objects/bullet.ts"/>
///<reference path="../include/game/objects/bomb.ts"/>
///<reference path="../include/game/common/skills.ts"/>
///<reference path="../include/game/common/effects.ts"/>
///<reference path="../include/game/game_result.ts"/>
///<reference path="../include/network_codes.ts"/>

//const ServerGame = (function() {
namespace ServerGame {
	try {
		var _RoomInfo_: typeof RoomInfo = require('./../include/room_info');
		var GameCore = require('./../include/game/game_core');
		var Colors = require('./../include/game/common/colors');
		var Vector = require('./../include/utils/vector');
		var Item = require('./../include/game/objects/item');
		var PoisonousEnemy = require('./../include/game/objects/poisonous_enemy');
		var Bullet = require('./../include/game/objects/bullet');
		var Bomb = require('./../include/game/objects/bomb');
		var Skills = require('./../include/game/common/skills');
		var Effects = require('./../include/game/common/effects');
		var GameResult = require('./../include/game/game_result');
		var NetworkCodes = require('./../include/network_codes');
	}
	catch(e) {}

	const H_PI = Math.PI/2;
	const fixAngle = (a: number) => -a + H_PI;
	const pow = (n: number) => n*n;

	const SYNC_EVERY_N_FRAMES = 240;//synchronize roughly each N/60 second

	const ROUND_START_DELAY = 4;//seconds

	//game constants
	const ENEMY_WAVES_FREQUENCY = 15;//spawn new enemies each n seconds
	const FIRST_ENEMY_WAVE_DELAY = ROUND_START_DELAY + 3;//seconds to first enemy wave
	const ENEMIES_PER_WAVE = 10, MAXIMUM_ENEMIES = 200, MAXIMUM_COMPETITION_ENEMIES = 100;

	const ITEM_SPAWN_FREQUENCY = 0.2;//changed from 0.5 (04.09.2018)

	const RESPAWN_DURATION = 3;//seconds

	//damages (moved to GameCore.PARAMS)
	//const ENEMY_COLLISION_DAMAGE = 0.2;

	//predefined bullets spawn offsets relative to player for each player type
	const bullets_offsets_1 = [{x: 0, y: 1}];
	const bullets_offsets_2 = [{x: -0.5, y: 1}, {x: 0.5, y: 1}];
	const bullets_offsets_3 = [{x: 0, y: 1}, {x: -0.5, y: 0.5}, {x: 0.5, y: 0.5}];

	//game logic variables
	var wave_i: number, chunk_it: number, chunk_ref, ss_i: number, obj_i: number, 
		p_i: number, e_i: number, s_i: number, b_i: number, s_h, 
		async_p_i: number, p_it: typeof Player.prototype, async_p_it: typeof Player.prototype, 
		async_s, r_p_i: number,//e_h, e_h2
		hit_x: number, hit_y: number, offsets, sin: number, cos: number, synch_array;

	let emitAction = (action: NetworkCodes, data?: any) => {
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
		var hrtime: number[], _dt = 0, _steps_: number, start: number, end: number, delta_sum = 0;

		var nano = function() {
			hrtime = process.hrtime();
			return (+hrtime[0]) * 1e9 + (+hrtime[1]);
		};

		return function(self: Class) {
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

	export class Class extends GameCore {
		private room: RoomInfo;
		public running: boolean;
		//private duration: number;
		private maximum_enemies: number;
		private bounceVec: VectorScope.Vector;
		private respawning_players: {player: typeof Player.prototype, time: number}[] = [];
		private dataForClients: (number | NetworkCodes)[] = [];
		public initialized: boolean;

		private time_to_enemy_wave = 0;
		private time_to_item_spawn = 0;
		private wave_number = 0;
		private time_to_spawn = 0;
		private spawn_timestamp = 0;
		private remaining_time = 0;
		private end_timestamp = 0;

		constructor(map: any, room: RoomInfo) {
			super();

			this.room = room;//contains players data

			this.running = false;
			//this.duration = 2674;//any value other than 0

			this.maximum_enemies = 0;

			if(room.gamemode === _RoomInfo_.MODES.COOPERATION)
				this.maximum_enemies = MAXIMUM_ENEMIES;
			else if(room.gamemode === _RoomInfo_.MODES.COMPETITION)
				this.maximum_enemies = MAXIMUM_COMPETITION_ENEMIES;

			this.bounceVec = new Vector.Vec2f();//buffer object for storing bounce results
			// this.respawning_players = [];

			// this.dataForClients = [];

			try {
				let result = super.loadMap(map);
				if(result !== true)
					throw new Error('Cannot load map');
			}
			catch(e) {
				emitAction( NetworkCodes.START_GAME_FAIL_ACTION );
			}

			this.initialized = true;
		}

		start() {
			console.log('Starting round');

			var init_data: InitDataSchema[] = [];

			let color_id = (Math.random() * Colors.PLAYERS_COLORS.length) | 0;

			for(let sit in this.room.sits) {
				let user_info = this.room.getUserByID( this.room.sits[sit] );
				if(user_info === null)
					continue;
				init_data.push({
					id: user_info.id,
					nick: user_info.nick,
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

			this.time_to_spawn = ROUND_START_DELAY;//first players spawning
			this.spawn_timestamp = Date.now() + (this.time_to_spawn * 1000);

			this.remaining_time = this.room.duration || 180;
			this.end_timestamp = Date.now() + (this.remaining_time * 1000);
			
			emitAction(NetworkCodes.START_ROUND_ACTION, {
				game_duration: this.remaining_time, 
				round_delay: ROUND_START_DELAY,
				init_data: init_data
			});

			this.running = true;
			runLoop(this);
		}

		end() {
			if(this.running !== true)
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
			async_p_it = <typeof Player.prototype>this.players[async_p_i];

			if((async_p_it).spawning === true)
				return;

			switch(data[0]) {
				case NetworkCodes.PLAYER_MOVEMENT:
					async_p_it.movement.state = data[1];
					
					//NOTE - this way the action is send immediatelly
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
		bouncePainter(object: Object2D, color: Uint8Array, bounce_vector: VectorScope.Vector) {
			//@ts-ignore
			return this.bounceOutOfColor(object, color, this, bounce_vector);//returns boolean
		}

		playerBounce(player: typeof Player.prototype, color: Uint8Array) {
			if(this.bouncePainter(player, color, this.bounceVec) === true) {
				this.dataForClients.push(NetworkCodes.ON_PLAYER_BOUNCE, this.players.indexOf(player), 
					player.x, player.y, player.rot, this.bounceVec.x, this.bounceVec.y);
				return true;
			}
			return false;
		}

		enemyBounce(enemy: typeof Enemy.prototype, color: Uint8Array) {
			if(this.bouncePainter(enemy, color, this.bounceVec) === true) {
				this.dataForClients.push(NetworkCodes.ON_ENEMY_BOUNCE, enemy.id,
					enemy.x, enemy.y, enemy.rot, this.bounceVec.x, this.bounceVec.y);
				enemy.frames_since_last_update = 0;
			}
		}

		bulletBounce(bullet: typeof Bullet.prototype, color: Uint8Array) {
			if(this.bouncePainter(bullet, color, this.bounceVec) === true) {
				this.dataForClients.push(NetworkCodes.ON_BULLET_BOUNCE, bullet.id,
					bullet.x, bullet.y, bullet.rot, this.bounceVec.x, this.bounceVec.y);
			}
		}

		onPlayerPainterCollision(player: typeof Player.prototype, color: Uint8Array) {
			//ignore self collisions
			if(Colors.compareByteBuffers(player.painter.color.byte_buffer, color) === true)
				return;

			if(Colors.compareByteBuffers(Colors.WALLS.byte_buffer, color) === true) {
				if(player.spawning === true) {//pushing out of safe area and finishing spawning
					this.bounceVec.set(player.x, player.y).normalize().scaleBy(
						GameCore.PARAMS.spawn_radius + GameCore.PARAMS.spawn_walls_thickness);
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
				if(player.effects.isActive( Effects.TYPES.POISONING ) === false) {
					player.effects.active( Effects.TYPES.POISONING );
					this.dataForClients.push(NetworkCodes.ON_PLAYER_POISONED,
						this.players.indexOf(player));
				}
			}
			else if(Colors.isPlayerColor(color)) {//checking collisions with other players curves
				//other painter collisions only in competition mode
				if(this.room.gamemode === _RoomInfo_.MODES.COMPETITION) {
					for(var player_col_i in Colors.PLAYERS_COLORS) {
						if(Colors.compareByteBuffers(Colors.PLAYERS_COLORS[player_col_i].byte_buffer, 
								color) === true) {
							// console.log('You hitted other player\'s painter');

							if(this.playerBounce(player, color) === true)
								this.onPlayerEnemyPainterCollision(player);
							
							//	console.log(this.bounceVec);
						}
					}
				}
			}
		}

		onEnemyPainterCollision(enemy: typeof Enemy.prototype, color: Uint8Array) {
			if(Colors.compareByteBuffers(Colors.WALLS.byte_buffer, color) === true) {
				this.enemyBounce(enemy, color);
			}
		}

		onBulletPainterCollision(bullet: typeof Bullet.prototype, color: Uint8Array) {
			//ignore self color collision
			if(Colors.compareByteBuffers(bullet.color.byte_buffer, color) === true)
				return;

			if( Colors.compareByteBuffers(Colors.WALLS.byte_buffer, color) || 
				Colors.compareByteBuffers(Colors.POISON.byte_buffer, color) ||
				Colors.isPlayerColor(color)) 
			{

				if(bullet.bouncing) {//bounce bullet if it is a bouncing-bullet type
					this.bulletBounce(bullet, color);
				}
				else {//exploding bullet
					hit_x = bullet.x + Math.cos(fixAngle(bullet.rot)) * bullet.width;
					hit_y = bullet.y + Math.sin(fixAngle(bullet.rot)) * bullet.height;

					super.paintHole(hit_x, hit_y, GameCore.PARAMS.bullet_explosion_radius);

					bullet.expired = true;
					
					this.dataForClients.push(NetworkCodes.ON_BULLET_EXPLODE, bullet.id, hit_x, hit_y);
				}
			}
		}

		onPlayerEnemyCollision(player: typeof Player.prototype, enemy: typeof Enemy.prototype) {
			if(enemy.isAlive() === false)
				return;
			this.bounceVec.set(player.x - enemy.x, player.y - enemy.y).normalize();

			//directing player outwards explosion center
			player.rot = -Math.atan2( this.bounceVec.y, this.bounceVec.x ) + Math.PI/2.0;
			player.movement.speed = player.movement.maxSpeed;

			if( player.effects.isActive(Effects.TYPES.SHIELD) === false && 
				player.effects.isActive(Effects.TYPES.SPAWN_IMMUNITY) === false ) 
			{
				player.hp -= GameCore.PARAMS.enemy_collision_damage;//ENEMY_COLLISION_DAMAGE;
				player.points -= GameCore.PARAMS.points_lose_for_enemy_collision;
			}

			//do not move player - prevents from jumping outside walls
			//player.x += this.bounceVec.x * GameCore.PARAMS.explosion_radius * 0.5;
			//player.y += this.bounceVec.y * GameCore.PARAMS.explosion_radius * 0.5;

			var xx = player.x - this.bounceVec.x * player.width;
			var yy = player.y - this.bounceVec.y * player.height;
			super.paintHole( xx, yy, GameCore.PARAMS.explosion_radius );

			//enemy dies on hit with player
			enemy.expired = true;

			this.dataForClients.push(NetworkCodes.ON_PLAYER_ENEMY_COLLISION, 
				enemy.id, this.players.indexOf(player), 
				player.x, player.y, player.rot, player.hp, player.points, 
				this.bounceVec.x, this.bounceVec.y);

			if(player.isAlive() === false)
				this.onPlayerDeath(player, 0);
		}

		onPlayerEnemySpawnerCollision(player: typeof Player.prototype, 
			spawner: typeof EnemySpawner.prototype) 
		{
			//@ts-ignore
			this.bounceOneObjectFromAnother(player, spawner);

			this.bounceVec.set(player.x - spawner.x, player.y - spawner.y).normalize();

			this.dataForClients.push(NetworkCodes.ON_PLAYER_BOUNCE, this.players.indexOf(player), 
				player.x, player.y, player.rot, this.bounceVec.x, this.bounceVec.y);
		}

		onEnemyEnemySpawnerCollision(enemy: typeof Enemy.prototype,
			spawner: typeof EnemySpawner.prototype) 
		{
			//@ts-ignore
			this.bounceOneObjectFromAnother(enemy, spawner);

			this.bounceVec.set(enemy.x - spawner.x, enemy.y - spawner.y).normalize();

			this.dataForClients.push(NetworkCodes.ON_ENEMY_BOUNCE, enemy.id, 
				enemy.x, enemy.y, enemy.rot, this.bounceVec.x, this.bounceVec.y);

			enemy.frames_since_last_update = 0;
		}

		onPlayerBulletCollision(player: typeof Player.prototype, bullet: typeof Bullet.prototype) {
			if(player.isAlive() === false || bullet.parent === player)
				return;

			hit_x = (player.x + bullet.x) / 2.0;
			hit_y = (player.y + bullet.y) / 2.0;

			var damage = 0;
			if(bullet.bouncing)
				damage = GameCore.PARAMS.player_to_bouncing_bullet_receptivity;
			else
				damage = GameCore.PARAMS.player_to_bullet_receptivity;

			this.onPlayerAttackedPlayer(<typeof Player.prototype>bullet.parent, player, damage);

			this.dataForClients.push( NetworkCodes.ON_BULLET_HIT, bullet.id, hit_x, hit_y );
			bullet.expired = true;
		}

		onEnemyBulletCollision(enemy: typeof Enemy.prototype, bullet: typeof Bullet.prototype) {
			if(enemy.isAlive() === false)//|| bullet.parent === enemy => TODO when enemy will shoot
				return;

			hit_x = (enemy.x + bullet.x) / 2.0;
			hit_y = (enemy.y + bullet.y) / 2.0;

			var damage = 0;
			if(bullet.bouncing)
				damage = GameCore.PARAMS.enemy_to_bouncing_bullet_receptivity;
			else
				damage = GameCore.PARAMS.enemy_to_bullet_receptivity;

			this.onPlayerAttackedEnemy(<typeof Player.prototype>bullet.parent, enemy, damage);

			//bullet dies on hit
			this.dataForClients.push( NetworkCodes.ON_BULLET_HIT, bullet.id, hit_x, hit_y );
			bullet.expired = true;
		}

		onPlayerItemCollision(player: typeof Player.prototype, item: typeof Item.prototype) {
			//console.log(item.type);
			switch(item.type) {
				default: throw new Error('Incorrect item type');
				case Item.TYPES.HEALTH:
					if(player.hp >= 0.995)
						return;
					player.hp += Item.HEALTH_VALUE;
					break;
				case Item.TYPES.ENERGY:
					if(player.energy >= 0.995)
						return;
					player.energy += Item.ENERGY_VALUE;
					break;
				case Item.TYPES.SPEED:
					player.effects.active( Effects.TYPES.SPEED );
					break;
			}

			this.dataForClients.push(NetworkCodes.ON_PLAYER_COLLECT_ITEM, 
				item.id, item.type, this.players.indexOf(player));

			item.expired = true;
		}

		onPlayerEnemyPainterCollision(player: typeof Player.prototype) {
			if(player.effects.isActive(Effects.TYPES.SHIELD) === false && 
				player.effects.isActive(Effects.TYPES.SPAWN_IMMUNITY) === false)
			{
				player.points -= GameCore.PARAMS.points_lose_for_enemy_painter_collision;
				player.hp -= GameCore.PARAMS.enemy_painter_collision_damage;
				if(player.hp < 0.01)
					player.hp = 0.01;
			}
			player.movement.speed = player.movement.maxSpeed;

			this.dataForClients.push(NetworkCodes.ON_PLAYER_ENEMY_PAINTER_COLLISION, 
				this.players.indexOf(player), player.x, player.y, player.hp, player.points);

			super.paintHole( player.x, player.y, GameCore.PARAMS.small_explosion_radius );
		}

		onPlayerDeath(player: typeof Player.prototype, explosion_radius: number) {
			this.dataForClients.push(NetworkCodes.ON_PLAYER_DEATH, 
				this.players.indexOf(player), RESPAWN_DURATION, player.x, player.y, explosion_radius);

			if(explosion_radius > 0)
				super.paintHole( player.x, player.y, explosion_radius );
			//GameCore.PARAMS.small_explosion_radius

			super.drawDeathMark( player.x, player.y, player.painter.color );

			player.deaths++;
			super.respawnPlayer(player);

			this.respawning_players.push({
				player: player,
				time: RESPAWN_DURATION
			});
		}

		onPlayerAttackedPlayer(attacker: typeof Player.prototype, victim: typeof Player.prototype, 
			damage: number)
		{
			if(this.room.gamemode !== _RoomInfo_.MODES.COMPETITION)
				return;

			victim.hp -= damage;//must be before putting data for clients

			this.dataForClients.push(
				NetworkCodes.ON_PLAYER_ATTACKED, 
				this.players.indexOf(attacker), damage,
				this.players.indexOf(victim), victim.hp, victim.x, victim.y
			);

			attacker.points += damage * GameCore.PARAMS.points_for_player_damage;

			if(victim.isAlive() === false) {
				this.onPlayerDeath(victim, GameCore.PARAMS.explosion_radius);

				attacker.kills++;
				attacker.points += GameCore.PARAMS.points_for_player_kill;
			}
		}

		onPlayerAttackedEnemy(player: typeof Player.prototype, enemy: typeof Enemy.prototype, 
			damage: number) 
		{
			enemy.hp_bar.hp -= damage;//must be before putting data for clients

			this.dataForClients.push(
				NetworkCodes.ON_ENEMY_ATTACKED, 
				enemy.id, damage,
				this.players.indexOf(player), enemy.hp_bar.hp, enemy.x, enemy.y
			);

			if(this.room.gamemode === _RoomInfo_.MODES.COOPERATION)
				player.points += damage * GameCore.PARAMS.points_for_enemy_damage;

			if(enemy.isAlive() === false) {//enemy was killed
				enemy.expired = true;
				super.paintHole( enemy.x, enemy.y, GameCore.PARAMS.explosion_radius );
					
				if(this.room.gamemode === _RoomInfo_.MODES.COOPERATION) {	
					player.kills++;
					player.points += GameCore.PARAMS.points_for_enemy_kill;
				}
			}
			//else {//enemy was hitted but not killed (cooperation only)
				//MOVED UP
			//}
		}

		onBombExplosion(bomb: typeof Bomb.prototype) {
			super.paintHole( bomb.x, bomb.y, GameCore.PARAMS.bomb_explosion_radius );

			const radius_pow = pow( GameCore.PARAMS.bomb_explosion_radius );
			
			for(e_i=0; e_i<this.enemies.length; e_i++) {
				if((<typeof Enemy.prototype>this.enemies[e_i]).spawning === false && 
				Vector.distanceSqrt(this.enemies[e_i], bomb) <= radius_pow) {
					//NOTE - 1.0 == 100% damage
					this.onPlayerAttackedEnemy( bomb.parent, 
						<typeof Enemy.prototype>this.enemies[e_i], 1.0);
				}
			}
			if(this.room.gamemode === _RoomInfo_.MODES.COMPETITION) {
				for(p_i=0; p_i<this.players.length; p_i++) {
					//@ts-ignore
					if(this.players[p_i] !== bomb.parent && this.players[p_i].spawning === false && 
					Vector.distanceSqrt(this.players[p_i], bomb) <= radius_pow ) {
						//@ts-ignore //NOTE - 1.0 == 100% damage
						this.onPlayerAttackedPlayer( bomb.parent, this.players[p_i], 1.0);
					}
				}
			}

			this.dataForClients.push(NetworkCodes.ON_BOMB_EXPLODED, bomb.id, bomb.x, bomb.y);
		}

		onStain(enemy: typeof Enemy.prototype) {
			let stain_index = GameCore.getRandomStainIndex();
			super.drawStain( stain_index, enemy.x, enemy.y, enemy.width );

			this.dataForClients.push(NetworkCodes.ON_POISON_STAIN, 
				stain_index, enemy.x, enemy.y, enemy.width*GameCore.PARAMS.stain_shrink);
		}

		initWave() {
			//console.log(this.enemies.length);
			if(this.enemies.length < this.maximum_enemies) {
				this.wave_number++;

				this.dataForClients.push(NetworkCodes.WAVE_INFO, this.wave_number);

				for(wave_i=0; wave_i < ENEMIES_PER_WAVE*this.players.length; wave_i++) {
					var enemy_class_index = GameCore.getRandomEnemyClassIndex();
					
					var enemy = super.spawnEnemy( enemy_class_index );
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
			var item = super.spawnItem( Item.randomType() );
			if(item !== null)
				this.dataForClients.push(NetworkCodes.SPAWN_ITEM, item.id, item.type, item.x, item.y);
		}

		applySkillEffect(player: typeof Player.prototype, skill: SkillsScope.SkillObject, 
			player_i: number, skill_i: number, immediately_response: boolean) 
		{
			//stopping skill using becouse player run out of energy or died and is spawning
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
					offsets = skill.data === Skills.SHOOT1 ? bullets_offsets_1 : 
						(skill.data === Skills.SHOOT2 ? bullets_offsets_2 : bullets_offsets_3);

					this.dataForClients.push( NetworkCodes.ON_BULLET_SHOT, player_i, 
						offsets.length );	

					for(let i in offsets) {
						sin = Math.sin(-player.rot);
						cos = Math.cos(-player.rot);

						let bullet = new Bullet(
							(offsets[i].x * cos - offsets[i].y * sin) * player.width + player.x, 
							(offsets[i].x * sin + offsets[i].y * cos) * player.height + player.y, 
							player.rot, 
							player//.painter.color
						);
						this.bullets.push( bullet );

						//fill rest data for clients
						this.dataForClients.push( bullet.id, bullet.x, bullet.y, bullet.rot );
					}
					break;
				case Skills.BOUNCE_SHOT:
					//BUGFIX - cannot use bounce shot inside poison
					if(player.effects.isActive(Effects.TYPES.POISONING)) {
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
						true // bouncing
					);
					this.bullets.push( bullet );

					//player_index, bullet_id, pos_x, pos_y, rot
					this.dataForClients.push( NetworkCodes.ON_BOUNCE_BULLET_SHOT, player_i, bullet.id,
						bullet.x, bullet.y, bullet.rot );
					break;
				case Skills.ENERGY_BLAST:
					// super.paintHole(player.x, player.y, GameCore.PARAMS.energy_blast_radius);
					this.dataForClients.push( 
						NetworkCodes.ON_ENERGY_BLAST, player.x, player.y, 
						Colors.PLAYERS_COLORS.indexOf(player.painter.color)
					);

					const radius_pow = pow( GameCore.PARAMS.energy_blast_radius );
					
					for(e_i=0; e_i<this.enemies.length; e_i++) {
						//@ts-ignore
						if(this.enemies[e_i].spawning === false && 
						Vector.distanceSqrt(this.enemies[e_i], player) <= radius_pow ) {
							this.onPlayerAttackedEnemy(
								player, <typeof Enemy.prototype>this.enemies[e_i], 
								GameCore.PARAMS.energy_blast_damage);
						}
					}

					if(this.room.gamemode === _RoomInfo_.MODES.COMPETITION) {
						for(p_i=0; p_i<this.players.length; p_i++) {
							//@ts-ignore
							if(this.players[p_i] !== player && this.players[p_i].spawning === false && 
							Vector.distanceSqrt(this.players[p_i], player) <= radius_pow ) {
								this.onPlayerAttackedPlayer(
									player, <typeof Player.prototype>this.players[p_i], 
									GameCore.PARAMS.energy_blast_damage);
							}
						}
					}
					break;
				case Skills.SHIELD:
					player.effects.active( Effects.TYPES.SHIELD );

					//NO NEED TO ADD SHIELD OBJECT SERVER-SIDE BECOUSE IT'S JUST A VISUAL EFFECT
					//player.effects.push( new Effect(Effect.SHIELD) );
					
					this.dataForClients.push( NetworkCodes.ON_SHIELD_EFFECT, player_i );
					break;
				case Skills.SPEED:
					player.effects.active( Effects.TYPES.SPEED );
					this.dataForClients.push( NetworkCodes.ON_SPEED_EFFECT, player_i );
					break;
				case Skills.INSTANT_HEAL:
					player.hp += GameCore.PARAMS.instant_heal_value;
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

			//immediatelly stop non-continous skills after it effect is applied
			if(skill.isContinous() === false)
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

		updateSpawnings(delta: number) {
			//first time spawning
			if(this.time_to_spawn !== 0) {
				this.time_to_spawn = (this.spawn_timestamp - Date.now()) / 1000;
				if(this.time_to_spawn <= 0) {
					//console.log('SPAWN TIME');
					
					for(p_i=0; p_i<this.players.length; p_i++) {
						p_it = <typeof Player.prototype>this.players[p_i];
						p_it.movement.setMaxSpeed();
						this.dataForClients.push(NetworkCodes.PLAYER_MOVEMENT_UPDATE, p_i, 
							p_it.rot, p_it.movement.state, p_it.movement.speed);
					}

					this.time_to_spawn = 0;
				}
			}

			//individual players spawnings
			for(r_p_i=0; r_p_i<this.respawning_players.length; r_p_i++) {
				if( (this.respawning_players[r_p_i].time -= delta) <= 0) {//spawning finished
					p_it = this.respawning_players[r_p_i].player;
					p_it.movement.setMaxSpeed();
					this.dataForClients.push(NetworkCodes.PLAYER_MOVEMENT_UPDATE, 
						this.players.indexOf(p_it), 
						p_it.rot, p_it.movement.state, p_it.movement.speed);

					this.dataForClients.push(NetworkCodes.ON_IMMUNITY_EFFECT, 
						this.players.indexOf(p_it));
					p_it.effects.active( Effects.TYPES.SPAWN_IMMUNITY );

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

		//@delta - fixed time in miliseconds
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
				if(this.bombs[b_i].expired === true)//bobm just exploded
					this.onBombExplosion( <typeof Bomb.prototype>this.bombs[b_i] );
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
				p_it = <typeof Player.prototype>this.players[p_i];

				//handling skills use
				for(s_i=0; s_i<p_it.skills.length; s_i++) {//for each player skills
					s_h = p_it.skills[s_i];
					if(s_h === null)
						continue;
					if(s_h.isInUse() === true) {//only for continous skills
						if(s_h.isContinous() === false)
							throw new Error('Not continous skill hasn\'t been stopped');
						this.applySkillEffect(p_it, s_h, p_i, s_i, false);
					}
				}

				//checking if alive
				if(p_it.isAlive() !== true) {//dead from poison etc
					this.onPlayerDeath(p_it, GameCore.PARAMS.small_explosion_radius);
				}

				//drawing player line segments for each player
				var segmentLength = Math.hypot(p_it.x-p_it.painter.lastPos.x, 
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
}//)();

export default ServerGame;
// try {//export for NodeJS
// 	module.exports = ServerGame;
// }
// catch(e) {}