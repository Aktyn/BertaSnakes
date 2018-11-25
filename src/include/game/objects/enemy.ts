///<reference path="hp_bar.ts"/>
///<reference path="../common/sensor.ts"/>
///<reference path="../common/movement.ts"/>
////<reference path="object2d.ts"/>

const Enemy = (function(/*Object2D, Movement, Sensor, HpBar*/) {

	try {
		var _Object2D_: typeof Object2D = require('./object2d');
		var _Movement_: typeof Movement = require('./../common/movement');
		var _Sensor_: typeof Sensor = require('./../common/sensor');
		var _HpBar_: typeof Objects.HpBar = require('./hp_bar').HpBar;
	}
	catch(e) {
		var _Object2D_ = Object2D;
		var _Movement_ = Movement;
		var _Sensor_ = Sensor;
		var _HpBar_ = Objects.HpBar;
	}

	const REGENERATION_SPEED = 0.025;
	//const ETITY_NAME = 'ENEMY_ROCKET';//ENEMY_ROCKET

	return class Enemy extends _Object2D_ {
		private entity_name: string;
		private movement: MovementScope.Movement;
		public sensor: Sensor.Class;
		public hp_bar: Objects.HpBar;

		private _spawning = false;

		public SCALE: number;

		constructor(entity_name: string, sensor_shape: any, SCALE: number, MAX_SPEED: number) {
			super();
			super.setScale(0, 0);

			this.SCALE = SCALE;
			this.entity_name = entity_name;

			this.movement = new _Movement_();
			this.movement.setOptions({
				maxSpeed: MAX_SPEED,//initial enemy speed
			});

			// this._spawning = false;

			this.sensor = new _Sensor_.Class( sensor_shape );
			this.hp_bar = new _HpBar_(SCALE, REGENERATION_SPEED);//needs destroying
			
			//@ts-ignore
			if(typeof Entities !== 'undefined')//client side
				//@ts-ignore
				Entities.EntitiesBase.addObject(Entities.EntitiesBase[entity_name].id, this);

		}

		destroy() {
			//@ts-ignore
			if(typeof Entities !== 'undefined')
				//@ts-ignore
				Entities.EntitiesBase.removeObject(Entities.EntitiesBase[this.entity_name].id, this);
			this.hp_bar.destroy();
		}

		isAlive() {
			return this.hp_bar.hp >= 0.005 || this.expired === true;
		}

		get spawning() {
			return this._spawning;
		}

		set spawning(value) {
			this._spawning = value;
			this.hp_bar.setVisible(!value);
		}

		update(delta: number) {
			this.movement.applyMove(this, delta);
			super.update(delta);

			this.hp_bar.update_hpbar(delta, this.x, this.y, this.height);
		}

		/*static get INITIAL_SCALE() {
			return SCALE;
		}*/
	};
})();

try {//export for NodeJS
	module.exports = Enemy;
}
catch(e) {}