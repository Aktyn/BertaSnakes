import {Emitter} from '../engine/graphics';

const PARTICLES = 4;
const vals = Emitter.VALUES_PER_PARTICLE;

const SPREAD_SPEED = 0.5, EXPLODING_TIME = 0.5, FADING_TIME = 0.9;

var i: number;

export default class ExplosionEmitter extends Emitter {
	private radius: number;
	private timer: number;

	constructor(x: number, y: number, radius: number) {
		super('ring', PARTICLES, false);

		this.radius = radius;
		this.timer = 0.0;

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = x;//
			this.data[i*vals + 1] = y;//
			this.data[i*vals + 2] = 0;//

			this.data[i*vals + 3] = 1.0;//r
			this.data[i*vals + 4] = 0.37;//g
			this.data[i*vals + 5] = 0.37;//b
			this.data[i*vals + 6] = 1.0;//Math.random();
		}
	}

	destroy() {
		super.destroy();
	}

	update(delta: number) {
		this.timer += delta;

		for(i=0; i<PARTICLES; i++) {
			if(this.data[i*vals + 2] != this.radius) {
				if(i === 0)
					this.data[i*vals+2] += (SPREAD_SPEED+1.0) * delta;//linear scale first particle
				else if(i < (this.timer * 8.0) + 2)
					this.data[i*vals+2] += 
						(SPREAD_SPEED + this.data[i*vals + 2] / this.radius) * delta;

				if(this.data[i*vals + 2] > this.radius)
					this.data[i*vals + 2] = this.radius;
			}
		}

		if(this.timer >= EXPLODING_TIME) {
			if(this.timer-EXPLODING_TIME < FADING_TIME) {
				for(i=0; i<PARTICLES; i++) {
					this.data[i*vals + 6] = 1.0 - (this.timer - EXPLODING_TIME) / FADING_TIME;
					if(this.data[i*vals + 6] < 0)
						this.data[i*vals + 6] = 0;
				}
			}
			else
				this.expired = true;
		}
	}
}