import {Emitter, getAspect} from '../engine/graphics';
import WeatherEmitter from './weather_emitter';

const PARTICLES = 100;
const vals = Emitter.VALUES_PER_PARTICLE;

let gauss: (n: number) => number = (n) => Math.random() * ( n <= 1 ? 1 : gauss(n-1) );

let i: number;

export default class DustEmitter extends WeatherEmitter {
	constructor() {
		super('fusion_particle', PARTICLES, true);

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = (Math.random() * 2.0 - 1.0) * getAspect();//x
			this.data[i*vals + 1] = Math.random() * 2.0 - 1.0;//yy
			this.data[i*vals + 2] = gauss(3) * 0.2 + 0.005;//scale

			this.data[i*vals + 3] = 1.0;//r
			this.data[i*vals + 4] = 1.0;//g
			this.data[i*vals + 5] = 1.0;//b
			this.data[i*vals + 6] = 0.015 + 0.02*Math.pow(1.0 - this.data[i*vals + 2] / 0.205, 2);
			//a (0.02)

			let angle = Math.random() * 2.0 * Math.PI;
			let rand_speed = (Math.random() * 0.4 + 0.8) * 0.1;

			this.velocities_data[i*2+0] = Math.cos(angle) * rand_speed;
			this.velocities_data[i*2+1] = Math.sin(angle) * rand_speed;
		}
	}

	destroy() {
		super.destroy();
	}
}