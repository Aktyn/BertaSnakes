/*Allow so steer and updatable object*/
const Movement = (function() {
	const H_PI = Math.PI/2;
	const PI_2 = Math.PI * 2;
	const fixAngle = a => -a + H_PI;

	const FLAGS = {
		LEFT: 	1 << 0,
		RIGHT: 	1 << 1,
		UP: 	1 << 2,
		DOWN: 	1 << 3,
		LOCKED_SPEED: 1 << 4
	};

	var rot = 0;

	var self = class {
		constructor() {
			this.speed = 0;

			this.setOptions({//default options
				maxSpeed: 0.4,
				acceleration: 0.5,
				turnSpeed: Math.PI
			});

			this._state = 0;//strores bit flags

			this.smooth = true;
		}

		set(flag, enable) {
			if(enable)
				this._state |= flag;
			else
				this._state &= ~flag;
		}

		resetState() {
			this._state = 0;
		}

		setMaxSpeed() {
			this.speed = this.maxSpeed;
		}

		get state() {
			return this._state;
		}
		set state(value) {
			this._state = value;
		}

		setOptions(opt) {
			if(opt.maxSpeed)		this.maxSpeed = opt.maxSpeed;
			if(opt.acceleration)	this.acceleration = opt.acceleration;
			if(opt.turnSpeed)		this.turnSpeed = opt.turnSpeed;
		}

		applyMove(object, delta) {
			if((this._state & FLAGS.LOCKED_SPEED) === 0) {
				if(this._state & FLAGS.UP)
					this.speed = Math.min(this.speed + this.acceleration * delta, this.maxSpeed);
				if(this._state & FLAGS.DOWN)
					this.speed = Math.max(this.speed - this.acceleration * delta, 0);
			}
			rot = object.rot;
			if(this._state & FLAGS.LEFT)
				rot -= delta * this.turnSpeed;
			if(this._state & FLAGS.RIGHT)
				rot += delta * this.turnSpeed;
			while(rot < 0)
				rot += PI_2;
			while(rot > PI_2)
				rot -= PI_2;

			object.setRot(rot, !this.smooth);
			
			object.move( 
				Math.cos(fixAngle(rot)) * delta * this.speed, 
				Math.sin(fixAngle(rot)) * delta * this.speed);
		}
	};

	Object.assign(self, FLAGS);

	return self;
})();

try {//export for NodeJS
	module.exports = Movement;
}
catch(e) {}