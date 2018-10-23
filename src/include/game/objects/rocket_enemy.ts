///<reference path="enemy.ts"/>
///<reference path="../common/sensor.ts"/>
//TODO - try reference renderer and emitter files

const RocketEnemy = (function(Enemy, Sensor) {
	const ETITY_NAME = 'ENEMY_ROCKET';
	const SCALE = 0.065, MAX_SPEED = 0.6;

	var renderer;

	return class RocketEnemy extends Enemy {
		private emitter?: any;

		constructor() {
			//let random_max_speed = (Math.random()*0.3 + 0.7) * MAX_SPEED;
			super(ETITY_NAME, Sensor.SHAPES.ROCKET, SCALE, MAX_SPEED);

			//@ts-ignore //client side
			if(typeof Renderer !== 'undefined' && typeof Emitters !== 'undefined') {
				//@ts-ignore
				this.emitter = Renderer.Class.addEmitter( new Emitters.Fussion() );
				this.emitter.visible = false;
			}
		}

		destroy() {
			if(this.emitter)
				this.emitter.expired = true;

			super.destroy();
		}

		update(delta: number) {
			super.update(delta);

			//@ts-ignore
			if( this.emitter && (renderer = Renderer.Class.getCurrentInstance()) !== null ) {
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
	typeof Enemy !== 'undefined' ? Enemy : require('./enemy'),
	typeof Sensor !== 'undefined' ? Sensor : require('./../common/sensor')
);

try {//export for NodeJS
	module.exports = RocketEnemy;
}
catch(e) {}