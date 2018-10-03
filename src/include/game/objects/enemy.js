const Enemy = (function(Object2D, Movement, Sensor, HpBar) {

	const REGENERATION_SPEED = 0.025;
	//const ETITY_NAME = 'ENEMY_ROCKET';//ENEMY_ROCKET

	return class extends Object2D {
		constructor(entity_name, sensor_shape, SCALE, MAX_SPEED) {
			super();
			super.setScale(0, 0);

			this.SCALE = SCALE;
			this.entity_name = entity_name;

			this.movement = new Movement();
			this.movement.setOptions({
				maxSpeed: MAX_SPEED,//initial enemy speed
			});

			this._spawning = false;

			this.sensor = new Sensor( sensor_shape );
			this.hp_bar = new HpBar(SCALE, REGENERATION_SPEED);//needs destroying
			
			if(typeof Entities !== 'undefined')//client side
				Entities.addObject(Entities[entity_name].id, this);

		}

		destroy() {
			if(typeof Entities !== 'undefined')
				Entities.removeObject(Entities[this.entity_name].id, this);
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

		update(delta) {
			this.movement.applyMove(this, delta);
			super.update(delta);

			this.hp_bar.update(delta, this.x, this.y, this.height);
		}

		/*static get INITIAL_SCALE() {
			return SCALE;
		}*/
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'),
	typeof Movement !== 'undefined' ? Movement : require('./../common/movement.js'),
	typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor.js'),
	typeof HpBar !== 'undefined' ? HpBar : require('./hp_bar.js')
);

try {//export for NodeJS
	module.exports = Enemy;
}
catch(e) {}