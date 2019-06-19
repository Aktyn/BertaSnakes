import {Emitter} from '../engine/graphics';

const PARTICLES = 10;
const vals = Emitter.VALUES_PER_PARTICLE;

const SCALE = 0.04;

var i: number;

export default class FussionEmitter extends Emitter {
	constructor() {
		super('fussion_particle', PARTICLES, true);

		this.setInitial();
	}

	destroy() {
		super.destroy();
	}

	setInitial() {
		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = 1e9;//set initial position for "far out of camera"
			this.data[i*vals + 1] = 1e9;
			this.data[i*vals + 2] = SCALE * (i / PARTICLES);//gauss(3) * 0.2 + 0.005;//scale

			this.data[i*vals + 3] = 0.25;//r
			this.data[i*vals + 4] = 0.5;//g
			this.data[i*vals + 5] = 1.0;//b
			this.data[i*vals + 6] = 0.75;
		}
	}

	update(delta: number, x: number, y: number, angle: number, radius: number) {
		for(i=0; i<PARTICLES; i++) {
			// this.data[i*vals + 6] -= delta * 0.075 / SCALE;
			if((this.data[i*vals + 2] -= delta*0.15) <= 0) {
				this.data[i*vals + 2] += SCALE;
				this.data[i*vals + 6] = 0.75;

				this.data[i*vals + 0] = x + Math.cos(-angle - Math.PI/2.0) * radius;
				this.data[i*vals + 1] = y + Math.sin(-angle - Math.PI/2.0) * radius;
			}
		}
	}
}