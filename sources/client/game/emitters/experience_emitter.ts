import {Emitter} from '../engine/graphics';
import Object2D from '../../../common/game/objects/object2d';

const PARTICLES = 20;
const vals = Emitter.VALUES_PER_PARTICLE;

const SCALE = 0.03, SPREAD_SPEED = 0.3, SPREAD_DURATION = 0.3;

var i: number, dx: number, dy: number, ddx: number, ddy: number, atan: number;

export default class ExperienceEmitter extends Emitter {
	private from: Object2D;
	private to: Object2D;

	private done: boolean;

	private angles: Float32Array;
	private spread_factor: number;
	private moving_speed: number;
	private timer: number;

	constructor(from_object: Object2D, to_object: Object2D) {
		super('fussion_particle', PARTICLES, true);

		this.from = from_object;
		this.to = to_object;
		//this.timer = 0.0;
		this.done = false;

		this.angles = new Float32Array(PARTICLES);
		this.spread_factor = 1.0;
		this.moving_speed = 0.0;
		this.timer = 0;

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = this.from.x;//
			this.data[i*vals + 1] = this.from.y;//
			this.data[i*vals + 2] = SCALE * (Math.random() * 0.5 + 0.5);//

			this.angles[i] = Math.random() * Math.PI * 2.0;

			this.data[i*vals + 3] = 1.0;//r
			this.data[i*vals + 4] = 0.85;//g
			this.data[i*vals + 5] = 0.4;//b
			this.data[i*vals + 6] = 1.0;//Math.random();
		}
	}

	destroy() {
		//@ts-ignore
		this.angles = null;
		super.destroy();
	}

	update(delta: number) {
		this.spread_factor -= delta / SPREAD_DURATION;
		this.moving_speed += delta;
		this.timer += delta;

		for(i=0; i<PARTICLES; i++) {
			ddx = this.to.x - this.data[i*vals + 0];
			ddy = this.to.y - this.data[i*vals + 1];
			atan = Math.atan2(ddy, ddx);
			dx = Math.cos(atan) * this.moving_speed;
			dy = Math.sin(atan) * this.moving_speed;

			if(this.spread_factor > 0) {
				dx += Math.cos(this.angles[i]) * SPREAD_SPEED;
				dy += Math.sin(this.angles[i]) * SPREAD_SPEED;
			}

			this.data[i*vals + 0] += dx * delta;
			this.data[i*vals + 1] += dy * delta;

			//close enough to target object
			if( (Math.abs(ddx) < 0.1 && Math.abs(ddy) < 0.1) || this.timer > 10 )
				this.done = true;//start vanishing stage
			
			if(this.done === true) {
				if( (this.data[i*vals + 6] -= delta*3.0) <= 0 )
					this.expired = true;
			}
		}
	}
}