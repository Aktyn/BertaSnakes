///<reference path="../objects/object2d_smooth.ts"/>

namespace MovementScope {
	//try {
		//var Object2DSmooth = require('./../objects/object2d_smooth');
	//}
	//catch(e) {}

	interface MovementOptionsI {
		maxSpeed?: number;
		acceleration?: number;
		turnSpeed?: number;
	}

	export class Movement {
		// private static H_PI = Math.PI/2;
		private static PI_2 = Math.PI * 2;
		private static fixAngle = (a: number) => -a + Math.PI/2;
		private static rot = 0;

		public static FLAGS = {
			LEFT: 	1 << 0,
			RIGHT: 	1 << 1,
			UP: 	1 << 2,
			DOWN: 	1 << 3,
			LOCKED_SPEED: 1 << 4
		};

		public speed = 0;
		private _state = 0;
		private smooth = true;

		public maxSpeed = 0.4;
		public acceleration = 0.5;
		public turnSpeed = Math.PI;

		constructor() {
			// this.speed = 0;

			/*this.setOptions({//default options
				maxSpeed: 0.4,
				acceleration: 0.5,
				turnSpeed: Math.PI
			});*/

			// this._state = 0;//strores bit flags

			// this.smooth = true;
		}

		set(flag: number, enable = false) {
			if(enable)
				this._state |= flag;
			else
				this._state &= ~flag;
		}

		isFlagEnabled(flag: number) {
			return !!(this._state & flag);
		}

		resetState(): void {
			this._state = 0;
		}

		setMaxSpeed(): void {
			this.speed = this.maxSpeed;
		}

		get state() {
			return this._state;
		}
		set state(value: number) {
			this._state = value;
		}

		setOptions(opt: MovementOptionsI) {
			if(opt.maxSpeed)		this.maxSpeed = opt.maxSpeed;
			if(opt.acceleration)	this.acceleration = opt.acceleration;
			if(opt.turnSpeed)		this.turnSpeed = opt.turnSpeed;
		}

		applyMove(object: Object2D, delta: number) {
			if((this._state & Movement.FLAGS.LOCKED_SPEED) === 0) {
				if(this._state & Movement.FLAGS.UP)
					this.speed = Math.min(this.speed + this.acceleration * delta, this.maxSpeed);
				if(this._state & Movement.FLAGS.DOWN)
					this.speed = Math.max(this.speed - this.acceleration * delta, 0);
			}
			Movement.rot = object.rot;
			if(this._state & Movement.FLAGS.LEFT)
				Movement.rot -= delta * this.turnSpeed;
			if(this._state & Movement.FLAGS.RIGHT)
				Movement.rot += delta * this.turnSpeed;
			while(Movement.rot < 0)
				Movement.rot += Movement.PI_2;
			while(Movement.rot > Movement.PI_2)
				Movement.rot -= Movement.PI_2;

			//@ts-ignore
			object.setRot(Movement.rot, !this.smooth);
			
			object.move( 
				Math.cos(Movement.fixAngle(Movement.rot)) * delta * this.speed, 
				Math.sin(Movement.fixAngle(Movement.rot)) * delta * this.speed);
		}
	}
}
	//Object.assign(self, FLAGS);

	//return self;
//})();
const Movement = MovementScope.Movement;

try {//export for NodeJS
	module.exports = Movement;
}
catch(e) {}