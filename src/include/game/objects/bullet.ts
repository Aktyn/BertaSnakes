///<reference path="../objects/object2d.ts"/>
///<reference path="../common/colors.ts"/>
///<reference path="../common/sensor.ts"/>
////<reference path="../../../client/game/entities.ts"/>

///<reference path="../common/painter.ts"/>
///<reference path="player.ts"/>

const Bullet = (function() {
	try {
		var _Object2D_: typeof Object2D = require('./object2d');
		var _Sensor_: typeof Sensor = require('./../common/sensor');
		//var _Player_: typeof Player = require('./player');
	}
	catch(e) {
		var _Object2D_ = Object2D;
		var _Sensor_ = Sensor;
		//var _Player_ = Player;
	}

	const SCALE = 0.02, DEFAULT_SPEED = 1.0, MAXIMUM_LIFETIME = 20;

	const H_PI = Math.PI/2;
	const fixAngle = (a: number) => -a + H_PI;

	return class Bullet extends _Object2D_ {
		public bouncing: boolean;
		public parent: Object2D;
		private lifetime: number;
		private speed: number;
		public sensor: Sensor.Class;

		//NOTE - parent must constains a Painter instance as 'painter' property name
		//@parent - instance that 'owns' this bullet
		constructor(x: number, y: number, rot: number, parent: Object2D, is_bouncing = false) {
			super();
			super.setScale(SCALE, SCALE);
			super.setPos(x, y);
			super.setRot(rot);

			this.bouncing = is_bouncing;// || false;

			//this.color = color;//color works as a player signature
			this.parent = parent;

			this.lifetime = MAXIMUM_LIFETIME;
			this.speed = DEFAULT_SPEED;

			this.sensor = new _Sensor_.Class( _Sensor_.SHAPES.BULLET );

			//@ts-ignore
			if(typeof Entities !== 'undefined') {
				// console.log('new bullet', Bullet.entityName(color));
				//@ts-ignore
				this.entity_name = Bullet.entityName(parent.painter.color);//clientside only
				//@ts-ignore
				Entities.addObject(Entities[this.entity_name].id, this);
			}
		}

		destroy() {
			//@ts-ignore
			if(typeof Entities !== 'undefined')
				//@ts-ignore
				Entities.removeObject(Entities[this.entity_name].id, this);
		}

		get color() {
			//@ts-ignore
			return this.parent.painter.color;
		}

		update(delta: number) {
			if((this.lifetime -= delta) <= 0)
				this.expired = true;

			super.move( 
				Math.cos(fixAngle(this.rot)) * delta * this.speed, 
				Math.sin(fixAngle(this.rot)) * delta * this.speed);

			super.update(delta);
		}

		static entityName(color: ColorsScope.ColorI) {
			return 'BULLET_' + Colors.PLAYERS_COLORS.indexOf(color);
		}
	};
})();

try {//export for NodeJS
	module.exports = Bullet;
}
catch(e) {}