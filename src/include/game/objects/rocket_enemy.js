const RocketEnemy = (function(Enemy, Sensor) {
	const ETITY_NAME = 'ENEMY_ROCKET';
	const SCALE = 0.065, MAX_SPEED = 0.6;

	var renderer;

	return class extends Enemy {
		constructor() {
			let random_max_speed = (Math.random()*0.3 + 0.7) * MAX_SPEED;
			super(ETITY_NAME, Sensor.SHAPES.ROCKET, SCALE, MAX_SPEED);

			if(typeof Renderer !== 'undefined' && typeof FussionEmitter !== 'undefined') {//client side
				this.emitter = Renderer.addEmitter( new FussionEmitter() );
				this.emitter.visible = false;
			}
		}

		destroy() {
			if(this.emitter)
				this.emitter.expired = true;

			super.destroy();
		}

		update(delta) {
			super.update(delta);

			if( this.emitter && (renderer = Renderer.getCurrentInstance()) !== null ) {
				if(this.spawning !== true) {
					if(renderer.withinVisibleArea(this.x, this.y, 0.25) === true) {
						this.emitter.visible = true;
						this.emitter.update(delta, this.x, this.y, this.rot, this.width * 0.8);
					}
					else {
						if(this.emitter.visible === true) {
							this.emitter.setInitial();//moves every emitter's particle away from view
							this.emitter.visible = false;
						}
					}
				}
			}
		}
	};
})(
	typeof Enemy !== 'undefined' ? Enemy : require('./enemy.js'),
	typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor.js')
);

try {//export for NodeJS
	module.exports = RocketEnemy;
}
catch(e) {}