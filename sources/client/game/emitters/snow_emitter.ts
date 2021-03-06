import {Emitter, getAspect} from '../engine/graphics';
import WeatherEmitter from './weather_emitter';

const PARTICLES = 300;
const vals = Emitter.VALUES_PER_PARTICLE;

let gauss: (n: number) => number = (n) => Math.random() * ( n <= 1 ? 1 : gauss(n-1) );

let i: number;

export default class SnowEmitter extends WeatherEmitter {
	constructor() {
		super('snow_particle', PARTICLES, false);

		for(i=0; i<PARTICLES; i++) {
			this.data[i*vals + 0] = (Math.random() * 2.0 - 1.0) * getAspect();//x
			this.data[i*vals + 1] = Math.random() * 2.0 - 1.0;//yy

			let rand = gauss(3);
			this.data[i*vals + 2] = rand * 0.15 + 0.005;//scale

			this.data[i*vals + 3] = 1.0;//r
			this.data[i*vals + 4] = 1.0;//g
			this.data[i*vals + 5] = 1.0;//b
			this.data[i*vals + 6] = (Math.pow(1.0 - rand, 3) + 0.1);
			//0.15 + 0.2*Math.pow(1.0 - this.data[i*vals + 2] / 0.205, 2);

			let angle = Math.PI/4.0 * (Math.random()*2.0 - 1.0) - Math.PI/2.0;
			let rand_speed = ((1.0-rand) + 0.5) * 0.5;

			this.velocities_data[i*2+0] = Math.cos(angle) * rand_speed;
			this.velocities_data[i*2+1] = Math.sin(angle) * rand_speed;
		}
	}

	destroy() {
		super.destroy();
	}
}