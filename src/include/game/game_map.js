const GameMap = (function(PaintLayer, Vector, Object2D) {
	const MAP_FOLDER = 'play/res/maps';
	const DEFAULT_WALLS_SIZE = 0.08;

	//helper variables
	var ui, obji, temp_arr;

	return class extends PaintLayer {
		constructor() {
			super();

			this.background = new Vector.Vec3f(1, 1, 1);

			//objects lists
			this.players = [];//@Player instances
			this.enemies = [];//@Enemy instances
			this.enemy_spawners = [];//@EnemySpawner
			this.items = [];//@Item
			this.bullets = [];//@Bullet
			//this.bounce_bullets = [];//@Bullet
			this.shields = [];//@Shield
			this.immunities = [];//@Immunity
			this.bombs = [];//@Bomb

			this.updatables = [//contains array that contains objects with update(delta) method
				this.players, this.enemies, this.enemy_spawners, this.items, 
				this.bullets, this.shields, this.immunities, this.bombs
			];

			//server-side use for constantly sending object updates each few frames
			//clientside use for receiving and applying updates
			this.server_synchronized = [this.enemies];
		}

		destroy() {
			super.destroy();
			//this.players.length = 0;
		}

		update(delta) {
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

		updateTimestamps(delta) {//clientside only
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

		loadMap(map) {//synchronous
			try {
				console.log('(' + map.name + ') map data:', map.data);

				super.size = map.data['size'] || 5;//default
				if(map.data['background_color'])
					this.background.set( ...map.data['background_color'].map(v => v/256) );

				super.generateChunks();

				super.paintMapWalls(map);
				super.drawWalls( DEFAULT_WALLS_SIZE );//TODO - make it modifable from map file

				//placing entities
				Object.keys(map.data.entities).forEach(key => {//for each entity
					map.data.entities[key].forEach(obj_data => {//for each object
						var obj = new Object2D().setPos(obj_data.x || 0, obj_data.y || 0)
							.setScale(obj_data.scale || 1, obj_data.scale || 1)
							.setRot(obj_data.rot || 0);

						if(typeof Entities !== 'undefined')
							Entities.addObject(Entities[key].id, obj);
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
})( 
	typeof PaintLayer !== 'undefined' ? PaintLayer : require('./paint_layer.js'),
	typeof Vector !== 'undefined' ? Vector : require('./../utils/vector.js'),
	typeof Object2D !== 'undefined' ? Object2D : require('./../game/objects/object2d.js') 
);

try {//export for NodeJS
	module.exports = GameMap;
}
catch(e) {}
