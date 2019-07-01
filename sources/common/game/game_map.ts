import Object2D from './objects/object2d';
import Player from './objects/player';
import Enemy from './objects/enemy';
import Bullet from './objects/bullet';
import {MapJSON_I} from './maps';
import PaintLayer from './paint_layer';
import Shield from "./objects/shield";
import Bomb from "./objects/bomb";
import EnemySpawner from "./objects/enemy_spawner";
import Item from "./objects/item";

//const MAP_FOLDER = 'play/res/maps';
const DEFAULT_WALLS_SIZE = 0.08;

//helper variables
let ui: number, obj_i: number, temp_arr: Object2D[];

export default class Map extends PaintLayer {
	public players: Player[] = [];
	public enemies: Enemy[] = [];
	public enemy_spawners: EnemySpawner[] = [];
	public items: Item[] = [];
	public bullets: Bullet[] = [];
	public shields: Shield[] = [];
	public immunities: Object2D[] = [];
	public bombs: Bomb[] = [];

	private readonly updatables: Object2D[][];

	public server_synchronized: Object2D[][];

	constructor() {
		super();

		//this.background = new _Vector_.Vec3f(1, 1, 1);

		this.updatables = [//contains array that contains objects with update(delta) method
			this.players, 			this.enemies, 
			this.enemy_spawners, 	this.items, 
			this.bullets, 			this.shields, 
			this.immunities, 		this.bombs
		];

		//server-side use for constantly sending object updates each few frames
		//client-side use for receiving and applying updates
		this.server_synchronized = [this.enemies];
	}

	destroy() {
		super.destroy();
		//this.players.length = 0;
	}

	update(delta: number) {
		//updating updatables
		for(ui=0; ui<this.updatables.length; ui++) {
			temp_arr = this.updatables[ui];
			for(obj_i=0; obj_i < temp_arr.length; obj_i++) {
				if( temp_arr[obj_i].expired ) {
					temp_arr[obj_i].destroy();
					temp_arr.splice(obj_i, 1);
					obj_i--;
				}
				else {
					temp_arr[obj_i].update(delta);
					temp_arr[obj_i].timestamp = 0;
				}
			}
		}
	}

	updateTimestamps(delta: number) {//client-side only
		let timestamp = Date.now();
		for(ui=0; ui<this.updatables.length; ui++) {
			temp_arr = this.updatables[ui];
			for(obj_i=0; obj_i < temp_arr.length; obj_i++) {
				if( temp_arr[obj_i].expired ) {
					temp_arr[obj_i].destroy();
					temp_arr.splice(obj_i, 1);
					obj_i--;
				}
				else if(temp_arr[obj_i].timestamp !== 0) {
					temp_arr[obj_i].update( (timestamp - temp_arr[obj_i].timestamp) / 1000.0 );
					temp_arr[obj_i].timestamp = 0;
				}
				else//object timestamp === 0
					temp_arr[obj_i].update(delta);
			}
		}
	}

	loadMap(map: MapJSON_I) {//synchronous
		try {
			// console.log('(' + map['name'] + ') map data:', map);
			console.log('map data:', map);
			//if(map.data === null)
			//	throw "No map data";

			this.size = map['map_size'];// || 5;//default
			//if(map.data['background_color'])
			//	this.background.set( ...map.data['background_color'].map(v => v/256) );

			super.generateChunks();

			super.paintMapWalls(map);
			super.drawWalls( DEFAULT_WALLS_SIZE );//TODO - make it modifiable from map file

			//placing entities
			/*Object.keys(map.data.entities).forEach(key => {//for each entity
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
			});*/

			return true;
		}
		catch(e) {
			console.error(e);
			return false;
		}
	}
}
