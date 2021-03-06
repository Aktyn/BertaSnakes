import {Emitter} from '../engine/graphics';
import WebGLRenderer from '../webgl_renderer';

const PARTICLES = 50;
const vals = Emitter.VALUES_PER_PARTICLE;

const SCALE = 0.15;
const SCALE_SPEED = (SCALE / 0.5);//0.5 seconds effect duration

let i: number, j: number;

export default class HitEmitter extends Emitter {
	private index: number;
	private readonly indexes: number[];

	constructor() {
		super('fusion_particle', PARTICLES, false);

		this.index = 0;
		this.indexes = [];

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = 0;//
			this.data[i*vals + 1] = 0;//
			this.data[i*vals + 2] = 0;//scale

			this.data[i*vals + 3] = 1;//r
			this.data[i*vals + 4] = 1;//g
			this.data[i*vals + 5] = 1;//b
			this.data[i*vals + 6] = 1.0;//Math.random();
		}
	}

	destroy() {
		super.destroy();
	}

	hit(x: number, y: number, damage: boolean) {
		//optimize by discarding hits beyond camera view
		if( !WebGLRenderer.getCurrentInstance().withinVisibleArea(x, y, 0.2) )
			return;

		this.data[this.index*vals + 0] = x;
		this.data[this.index*vals + 1] = y;

		if(damage) {
			this.data[this.index*vals + 3] = 1;
			this.data[this.index*vals + 4] = 0.75;
			this.data[this.index*vals + 5] = 0.65;
		}
		else {
			this.data[this.index*vals + 3] = 1;
			this.data[this.index*vals + 4] = 1;
			this.data[this.index*vals + 5] = 1;
		}

		this.indexes.push(this.index);

		this.index = (this.index+1) % PARTICLES;
	}

	update(delta: number) {
		for(j=0; j<this.indexes.length; j++) {
			i = this.indexes[j];
			if( (this.data[i*vals + 2] += delta * SCALE_SPEED) >= SCALE ) {
				this.data[i*vals + 2] = 0;
				this.data[i*vals + 6] = 0;

				this.indexes.splice(j, 1);
				j--;
			}
			else
				this.data[i*vals + 6] = 1.0 - this.data[i*vals + 2] / SCALE;//alpha
		}
	}
}