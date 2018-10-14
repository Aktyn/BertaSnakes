///<reference path="paint_layer.ts"/>

///<reference path="objects/player.ts"/>
///<reference path="objects/enemy.ts"/>
///<reference path="objects/rocket_enemy.ts"/>
///<reference path="objects/poisonous_enemy.ts"/>
///<reference path="objects/enemy_spawner.ts"/>
///<reference path="objects/item.ts"/>
///<reference path="objects/bullet.ts"/>
///<reference path="objects/shield.ts"/>
///<reference path="objects/immunity.ts"/>
///<reference path="objects/bomb.ts"/>

// const GameMap = (function(/*PaintLayer, Vector, Object2D*/) {
namespace GameMap {
	try {
		var _PaintLayer_: typeof PaintLayer = require('./paint_layer');
		var _Vector_: typeof VectorScope.Vector = require('./../utils/vector');
		var _Object2D_: typeof Object2D = require('./../game/objects/object2d');
	}
	catch(e) {
		var _Object2D_ = Object2D;
		var _Vector_ = Vector;
		var _PaintLayer_ = PaintLayer;
	}

	//const MAP_FOLDER = 'play/res/maps';
	const DEFAULT_WALLS_SIZE = 0.08;

	//helper variables
	var ui: number, obji: number, temp_arr: Object2D[];

	export class Map extends _PaintLayer_.Layer {
		public background: VectorScope.Vector;

		// public players: (typeof Player)[] = [];
		// public enemies: (typeof Enemy)[] = [];
		// public enemy_spawners: (typeof EnemySpawner)[] = [];
		// public items: (typeof Item)[] = [];
		// public bullets: (typeof Bullet)[] = [];
		// public shields: (typeof Shield)[] = [];
		// public immunities: (typeof Immunity)[] = [];
		// public bombs: (typeof Bomb)[] = [];
		public players: Object2D[] = [];
		public enemies: Object2D[] = [];
		public enemy_spawners: Object2D[] = [];
		public items: Object2D[] = [];
		public bullets: Object2D[] = [];
		public shields: Object2D[] = [];
		public immunities: Object2D[] = [];
		public bombs: Object2D[] = [];

		private updatables: Object2D[][];

		public server_synchronized: Object2D[][];

		constructor() {
			super();

			this.background = new _Vector_.Vec3f(1, 1, 1);

			this.updatables = [//contains array that contains objects with update(delta) method
				<Object2D[]><unknown>this.players, 			<Object2D[]><unknown>this.enemies, 
				<Object2D[]><unknown>this.enemy_spawners, 	<Object2D[]><unknown>this.items, 
				<Object2D[]><unknown>this.bullets, 			<Object2D[]><unknown>this.shields, 
				<Object2D[]><unknown>this.immunities, 		<Object2D[]><unknown>this.bombs
			];

			//server-side use for constantly sending object updates each few frames
			//clientside use for receiving and applying updates
			this.server_synchronized = [<Object2D[]><unknown>this.enemies];
		}

		destroy() {
			super.destroy();
			//this.players.length = 0;
		}

		update(delta: number) {
			//updating updatables
			for(ui=0; ui<this.updatables.length; ui++) {
				temp_arr = this.updatables[ui];
				for(obji=0; obji < temp_arr.length; obji++) {
					if(temp_arr[obji].expired === true) {
						temp_arr[obji].destroy();
						temp_arr.splice(obji, 1);
						obji--;
					}
					else {
						temp_arr[obji].update(delta);
						temp_arr[obji].timestamp = 0;
					}
				}
			}
		}

		updateTimestamps(delta: number) {//clientside only
			var timestamp = Date.now();
			for(ui=0; ui<this.updatables.length; ui++) {
				temp_arr = this.updatables[ui];
				for(obji=0; obji < temp_arr.length; obji++) {
					if(temp_arr[obji].expired === true) {
						temp_arr[obji].destroy();
						temp_arr.splice(obji, 1);
						obji--;
					}
					else if(temp_arr[obji].timestamp !== 0) {
						//console.log( (timestamp - temp_arr[obji].timestamp) / 1000.0 );
						temp_arr[obji].update( (timestamp - temp_arr[obji].timestamp) / 1000.0 );
						temp_arr[obji].timestamp = 0;
					}
					else//object timestamp === 0
						temp_arr[obji].update(delta);
				}
			}
		}

		loadMap(map: MapJSON_I) {//synchronous
			try {
				console.log('(' + map.name + ') map data:', map.data);
				if(map.data === null)
					throw "No map data";
					

				this.size = map.data['size'] || 5;//default
				if(map.data['background_color'])
					this.background.set( ...map.data['background_color'].map(v => v/256) );

				super.generateChunks();

				super.paintMapWalls(map);
				super.drawWalls( DEFAULT_WALLS_SIZE );//TODO - make it modifable from map file

				//placing entities
				Object.keys(map.data.entities).forEach(key => {//for each entity
					//@ts-ignore
					map.data.entities[key].forEach(obj_data => {//for each object
						var obj = new _Object2D_().setPos(obj_data.x || 0, obj_data.y || 0)
							.setScale(obj_data.scale || 1, obj_data.scale || 1)
							.setRot(obj_data.rot || 0);

						//@ts-ignore
						if(typeof Entities !== 'undefined') {
							//@ts-ignore
							Entities.addObject(Entities[key].id, obj);
						}
					});
				});

				return true;
			}
			catch(e) {
				console.error(e);
				//onLoad(false);
				return false;
			}
		}
	};
}//)();

try {//export for NodeJS
	module.exports = GameMap;
}
catch(e) {}
