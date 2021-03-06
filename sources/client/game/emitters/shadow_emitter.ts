import {Emitter} from '../engine/graphics';
	
const PARTICLES = 1;
const vals = Emitter.VALUES_PER_PARTICLE;

const EFFECT_DURATION = 15, VANISHING_DURATION = 10;//seconds
const INITIAL_ALPHA = 0.3333;

let i: number;

export default class ShadowEmitter extends Emitter {
	private timer: number;

	constructor(x: number, y: number, radius: number) {
		super('fusion_particle', PARTICLES, false);

		this.timer = 0.0;

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = x;
			this.data[i*vals + 1] = y;
			this.data[i*vals + 2] = radius;

			this.data[i*vals + 3] = 0;//r
			this.data[i*vals + 4] = 0;//g
			this.data[i*vals + 5] = 0;//b
			this.data[i*vals + 6] = INITIAL_ALPHA;
		}
	}

	destroy() {
		super.destroy();
	}

	update(delta: number) {
		if( (this.timer += delta) > EFFECT_DURATION ) {
			if(this.timer >= EFFECT_DURATION+VANISHING_DURATION) {
				this.expired = true;
				return;
			}
			
			for(i=0; i<PARTICLES; i++) {//update transparency
				this.data[i*vals+6] = INITIAL_ALPHA * 
					(1.0 - (this.timer - EFFECT_DURATION) / VANISHING_DURATION);
			}
		}
	}
}