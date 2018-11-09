///<reference path="game_map.ts"/>
///<reference path="collision_detector.ts"/>
///<reference path="common/colors.ts"/>
////<reference path="objects/player.ts"/>
///<reference path="objects/enemy.ts"/>
////<reference path="objects/rocket_enemy.ts"/>
////<reference path="objects/poisonous_enemy.ts"/>
////<reference path="objects/enemy_spawner.ts"/>
///<reference path="objects/item.ts"/>

interface InitDataSchema {
	id: number;
	nick: string;
	level: number;
	rank: number;
	ship_type: number;
	skills: (number | null)[];
	color_id: number;
}

const GameCore = (function(/*GameMap, CollisionDetector, Colors, Player, 
	RocketEnemy, PoisonousEnemy, EnemySpawner, Vector, Item*/) {

	try {
		var _GameMap_: typeof GameMap = require('./game_map');
		var _CollisionDetector_: typeof CollisionDetector = require('./collision_detector');
		var _Colors_: typeof Colors = require('./common/colors');
		var _Player_: typeof Player = require('./objects/player');
		var _RocketEnemy_: typeof RocketEnemy = require('./objects/rocket_enemy');
		var _PoisonousEnemy_: typeof PoisonousEnemy = require('./objects/poisonous_enemy');
		var _EnemySpawner_: typeof EnemySpawner = require('./objects/enemy_spawner');
		//var _Enemy_: typeof Enemy = require('./objects/enemy');
		var _Vector_: typeof Vector = require('./../utils/vector');
		var _Item_: typeof Item = require('./objects/item');
	}
	catch(e) {
		var _GameMap_ = GameMap;
		var _CollisionDetector_ = CollisionDetector;
		var _Colors_ = Colors;
		var _Player_ = Player;
		var _RocketEnemy_ = RocketEnemy;
		var _PoisonousEnemy_ = PoisonousEnemy;
		var _EnemySpawner_ = EnemySpawner;
		//var _Enemy_ = Enemy;
		var _Vector_ = Vector;
		var _Item_ = Item;
	}

	const PARAMS = {
		spawn_radius: 0.33,
		spawn_offset: 0.266,
		spawn_walls_thickness: 0.08,
		death_mark_size: 0.04,

		//damages
		enemy_to_bullet_receptivity: 0.3,//hp taken from enemy on bullet hit
		enemy_to_bouncing_bullet_receptivity: 0.4,//hp taken from enemy on bouncing bullet hit
		player_to_bullet_receptivity: 0.3,
		player_to_bouncing_bullet_receptivity: 0.4,
		energy_blast_damage: 0.6,//hp cause to each enemy in blast range
		enemy_collision_damage: 0.2,
		enemy_painter_collision_damage: 0.2,

		//effects parameters
		explosion_radius: 0.5,//on enemy dead explosion
		small_explosion_radius: 0.3,//on player dead from poison or smth like that
		//radius after bullet explosion, 0.02 is additional scale offset   old value: 0.066,
		bullet_explosion_radius: (2.0 * _Player_.INITIAL_SCALE / Math.sqrt(3)) + 0.02,
		bomb_explosion_radius: 0.75,
		energy_blast_radius: 0.5,

		//points
		points_for_enemy_damage: 50,//x points for taking 100% enemy's health
		points_for_player_damage: 500,//x points for every 1% of tankes player's health
		points_for_enemy_kill: 100,
		points_for_player_kill: 1000,
		//points_for_enemy_hit: 25,//deprecated
		points_lose_for_enemy_collision: 100,//ammount of points lost when player collides enemy
		points_lose_for_enemy_painter_collision: 200,//points lost on enemy painter collision

		//others
		instant_heal_value: 0.3,
		stain_shrink: 0.825
	};

	const STAINS = [[[-0.07,-0.23,0.57],[0.18,0.46,0.53],[0.26,0.08,0.85],[0.07,0.18,0.68],[-0.44,0.18,0.58],[-0.11,-0.5,0.88]],[[0.16,-0.07,0.9],[0.01,0.04,0.77],[0.05,-0.21,0.83],[-0.05,-0.38,0.53],[-0.46,0.18,0.98],[0.1,-0.08,0.79]],[[0.05,0.46,0.88],[0.46,-0.3,0.57],[-0.37,-0.17,0.91],[-0.06,-0.29,0.64],[0.18,-0.4,0.87],[0.14,-0.16,0.61]],[[0.26,0.15,0.79],[-0.12,0.43,0.67],[0.06,-0.38,0.84],[0.18,0.48,0.57],[-0.16,0.02,0.83],[-0.5,0.13,0.68]],[[-0.02,0.25,0.79],[-0.04,-0.16,0.86],[-0.07,-0.18,0.88],[-0.05,0.14,0.74],[0.07,-0.21,0.66],[0.37,-0.24,0.82]],[[0.34,0.13,0.73],[0.39,-0.03,0.55],[0.22,-0.21,0.65],[-0.22,0.24,0.88],[-0.38,0.42,0.97],[0.45,-0.49,0.62]],[[-0.12,0.1,0.68],[0.26,0.32,0.65],[0.41,-0.14,0.64],[0.48,0.44,0.61],[-0.43,-0.06,0.92],[-0.21,0.12,0.93]],[[-0.3,0.32,0.79],[-0.42,-0.09,0.59],[0.05,0.46,0.54],[0.15,0.42,0.69],[-0.17,0.08,0.85],[0.12,0,0.74]],[[0.48,-0.03,0.89],[0.1,0.06,0.71],[0.09,0.44,0.93],[-0.42,0.06,0.61],[0.21,-0.38,0.9],[-0.35,-0.04,0.51]],[[-0.11,0.25,0.96],[0.09,0.49,0.5],[0.27,0.33,0.84],[-0.24,0.36,0.77],[0.17,-0.2,0.92],[-0.14,-0.22,0.89]],[[0.4,-0.05,0.9],[0.33,0.44,0.93],[-0.46,0.23,0.63],[0.12,-0.36,0.72],[0.11,0.35,0.97],[0.2,-0.11,0.8]],[[0.38,0.42,0.54],[0.02,0.03,0.9],[0.42,0.12,0.92],[-0.42,-0.39,0.96],[0.42,0.38,0.68],[0.26,-0.33,0.82]],[[-0.11,0.44,0.84],[-0.03,0.01,0.57],[0.21,0.08,0.95],[0.31,0.15,0.67],[-0.16,0.23,0.56],[-0.43,0.17,0.7]],[[-0.35,0.47,0.53],[0.07,-0.33,0.86],[0.07,0.2,0.53],[0.04,-0.42,0.63],[0.34,0.38,0.87],[-0.12,-0.33,0.75]],[[0.01,-0.09,0.86],[0.31,-0.37,0.67],[0.25,0.44,0.82],[-0.32,-0.1,0.88],[-0.07,-0.09,0.7],[-0.31,0.18,0.66]],[[0.13,-0.08,0.72],[0.41,-0.07,0.96],[0.49,-0.32,0.74],[-0.26,-0.27,0.99],[-0.02,0.1,0.68],[-0.17,-0.25,0.58]],[[0.22,-0.41,0.97],[0.42,0.47,0.75],[0.26,-0.47,0.99],[-0.36,0.07,0.66],[0.03,0.4,0.99],[-0.19,0.41,0.81]],[[0.43,0.39,0.93],[0.05,-0.27,0.61],[0.45,-0.36,0.51],[0.37,-0.08,0.82],[0.49,0.21,0.79],[0.42,-0.27,0.53]],[[-0.17,0.03,0.69],[-0.11,-0.1,0.67],[-0.48,0.13,0.56],[0.48,-0.27,0.96],[0.24,0,0.8],[0.28,0.1,0.83]],[[0.13,-0.24,0.64],[0.22,0.02,0.99],[-0.24,0.43,0.75],[-0.2,0.36,0.83],[-0.35,-0.4,0.88],[0.22,0.42,0.79]]];

	const ENEMY_CLASSES = [_PoisonousEnemy_, _RocketEnemy_];
	//NOTE - sum of this array must be equal to 1 and it must be sorted with ascending order
	const ENEMY_SPAWN_PROPABILITES = [0.03, 0.97];//0.03, 0.97

	var InterfaceWith = function(ParentInstance: any, Interface: any) {
		Object.getOwnPropertyNames(Interface).forEach(prop => {
			if(typeof ParentInstance[prop] === 'undefined')
				ParentInstance[prop] = (<any>Interface)[prop];
		});
	};

	/////////////
	var vec2: VectorScope.Vector = new _Vector_.Vec2f(), p_i: number, st_i: number;

	class GameCore extends _GameMap_.Map {
		private last_respawn_angle = Math.PI / 2.0;

		constructor() {
			super();
			//if(!_CLIENT_) {//interface only server side becouse collision are handling on server
			if(typeof module !== 'undefined') {
				console.log( 'Assigning collision detecting methods to GameCore instance' );
				InterfaceWith(this, _CollisionDetector_);//assigns CollisionDetector interface
			}

			// this.last_respawn_angle = Math.PI / 2.0;
		}

		destroy() {
			super.destroy();
		}

		initPlayers(init_data: InitDataSchema[]) {//@init_data - array of players data
			super.paintHole(0, 0, PARAMS.spawn_radius + PARAMS.spawn_offset);
			super.drawSpawn(PARAMS.spawn_radius, PARAMS.spawn_walls_thickness);

			//let colors = Object.values(Colors.PLAYERS_COLORS);

			for(let i=0; i<init_data.length; i++) {
				let player = new _Player_( init_data[i]['ship_type'], init_data[i]['skills'], 
					_Colors_.PLAYERS_COLORS[ init_data[i].color_id|0 ] );
				player.user_id = init_data[i]['id'];
				player.nick = init_data[i]['nick'];
				player.level = init_data[i]['level'];
				player.rank = init_data[i]['rank'];

				let a = Math.PI * 2.0 * i/init_data.length + Math.PI / 2;
				player.setPos( 
					Math.cos(a)*PARAMS.spawn_radius/2, 
					Math.sin(a)*PARAMS.spawn_radius/2 ).setRot(-a + Math.PI/2);
				player.painter.lastPos.set(player.x, player.y);
				player.spawning = true;
				player.painter.active = false;

				// player.movement.speed = player.movement.maxSpeed;

				//super.addPlayer( player );
				this.players.push( <any>player );
			}
		}

		respawnPlayer(player: any) {
			player.spawning = true;
			player.effects.clearAll();

			let a = this.last_respawn_angle;//Math.PI / 2;
			this.last_respawn_angle += Math.PI * 2.0 / this.players.length + (Math.PI*2.0 / 16);
			player.setPos( 
				Math.cos(a)*PARAMS.spawn_radius/2, 
				Math.sin(a)*PARAMS.spawn_radius/2 ).setRot(-a + Math.PI/2);
			player.movement.speed = 0;
			player.movement.resetState();
			
			player.painter.active = false;
			player.painter.lastPos.set(player.x, player.y);

			player.hp = 1;
			player.energy = 1;
		}

		spawnEnemy(class_index: number) {//returns reference to created Enemy instance (server-side use)
			//@ts-ignore
			if( this.findRandomEmptySpot(this, _EnemySpawner_.SCALE, vec2) === false )
				return null;//no empty spot found

			let enemy = new ENEMY_CLASSES[class_index]();//new RocketEnemy();
			enemy.setPos(vec2.x, vec2.y);
			enemy.setRot( Math.random() * Math.PI * 2 );//random player angle

			this.enemies.push( <any>enemy );

			this.enemy_spawners.push( <any>new _EnemySpawner_(<typeof Enemy><unknown>enemy) );

			return enemy;
		}


		spawnItem(type: any) {
			//@ts-ignore
			if( this.findRandomEmptySpot(this, _EnemySpawner_.SCALE, vec2) === false )
				return null;//no empty spot found



			let item = new _Item_(type);
			item.setPos(vec2.x, vec2.y);

			this.items.push( <any>item );

			return item;
		}

		drawDeathMark(x: number, y: number, color: ColorsScope.ColorI) {//death symbol after player death
			this.color = color.hex;

			super.drawLine(x-PARAMS.death_mark_size, y-PARAMS.death_mark_size, 
				x+PARAMS.death_mark_size, y+PARAMS.death_mark_size, 0.01);
			super.drawLine(x-PARAMS.death_mark_size, y+PARAMS.death_mark_size, 
				x+PARAMS.death_mark_size, y-PARAMS.death_mark_size, 0.01);
		}

		drawStain(stain_index: number, x: number, y: number, size: number) {//poison stain
			this.color = _Colors_.POISON.hex;

			for(st_i=0; st_i<STAINS[stain_index].length; st_i++) {
				this.drawCircle(
					x + STAINS[stain_index][st_i][0] * size, 
					y + STAINS[stain_index][st_i][1] * size, 
					STAINS[stain_index][st_i][2] * size);
			}
			
		}

		findPlayerIndexByColor(color: ColorsScope.ColorI) {
			for(p_i=0; p_i<this.players.length; p_i++) {
				if((<any>this.players[p_i]).painter.color === color)//NOTE strict equal operator
					return p_i;
			}
			return -1;//in case player with given color is not found
		}

		update(delta: number) {
			super.update(delta);
		}

		static GET_PARAMS() {
			return PARAMS;
		}

		static GET_ENEMY_CLASSES(): (typeof RocketEnemy | typeof PoisonousEnemy)[] {
			return ENEMY_CLASSES;
		}

		static getRandomEnemyClassIndex() {
			let random_value = Math.random();//[0, 1]
			let prop_sum = 0;

			for(var i=0; i<ENEMY_SPAWN_PROPABILITES.length; i++) {
				if(random_value < ENEMY_SPAWN_PROPABILITES[i] + prop_sum)
					return i;
				prop_sum += ENEMY_SPAWN_PROPABILITES[i];
			}
			throw new Error('Cannot get random index from ENEMY_SPAWN_PROPABILITES');
		}

		static getRandomStainIndex() {
			return (Math.random() * STAINS.length) | 0;
		}
	}

	return GameCore;
})();

try {//export for NodeJS
	module.exports = GameCore;
}
catch(e) {}
