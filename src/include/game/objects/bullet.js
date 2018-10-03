const Bullet = (function(Object2D, Sensor) {
	const SCALE = 0.02, DEFAULT_SPEED = 1.0, MAXIMUM_LIFETIME = 20;

	const H_PI = Math.PI/2;
	const fixAngle = a => -a + H_PI;

	return class extends Object2D {
		//NOTE - parent must constains a Painter instance as 'painter' property name
		constructor(x, y, rot, parent, is_bouncing) {//@parent - instance that 'owns' this bullet
			super();
			super.setScale(SCALE, SCALE);
			super.setPos(x, y);
			super.setRot(rot);

			this.bouncing = is_bouncing || false;

			//this.color = color;//color works as a player signature
			this.parent = parent;

			this.lifetime = MAXIMUM_LIFETIME;
			this.speed = DEFAULT_SPEED;

			this.sensor = new Sensor( Sensor.SHAPES.BULLET );

			if(typeof Entities !== 'undefined') {
				// console.log('new bullet', Bullet.entityName(color));
				this.entity_name = Bullet.entityName(parent.painter.color);//clientside only
				Entities.addObject(Entities[this.entity_name].id, this);
			}
		}

		destroy() {
			if(typeof Entities !== 'undefined')
				Entities.removeObject(Entities[this.entity_name].id, this);
		}

		get color() {
			return this.parent.painter.color;
		}

		update(delta) {
			if((this.lifetime -= delta) <= 0)
				this.expired = true;

			super.move( 
				Math.cos(fixAngle(this.rot)) * delta * this.speed, 
				Math.sin(fixAngle(this.rot)) * delta * this.speed);

			super.update(delta);
		}

		static entityName(color) {
			return 'BULLET_' + Object.values(Colors.PLAYERS_COLORS).indexOf(color);
		}
	};
})(
	typeof Object2D !== 'undefined' ? Object2D : require('./object2d.js'),
	typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor.js')
);

try {//export for NodeJS
	module.exports = Bullet;
}
catch(e) {}