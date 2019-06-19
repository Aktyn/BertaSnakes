import {Emitter, getAspect} from '../engine/graphics';
import WeatherEmitter from './weather_emitter';

const PARTICLES = 200;
const CLOUDS = 10, CLOUD_SIZE_X = 0.3, CLOUD_SIZE_Y = 0.15, MAX_CLOUD_SPEED = 0.1;
const vals = Emitter.VALUES_PER_PARTICLE;

let gauss: (n: number) => number = (n) => Math.random() * ( n <= 1 ? 1 : gauss(n-1) );
let randPos = () => Math.random() * 2.0 - 1.0;

var i: number;

export default class CloudsEmitter extends WeatherEmitter {
	constructor() {
		super('cloud_particle', PARTICLES, false);

		var data = new Array(CLOUDS).fill(0).map(() => {return {
			x: randPos() * getAspect(),
			y: randPos(),
			scale: Math.random() * 0.1 + 0.9,
			lightness: 1.0 - Math.pow(Math.random(), 4)*0.3,
			tint: new Array(3).fill(0).map(() => 1.0 - gauss(3) * 0.2),
			speed_factor: (Math.random()*0.5 + 0.5) * 2.0 - 1.0
		}});

		for(i=0; i<PARTICLES; i++) {
			var c_i = Math.floor(i / PARTICLES * CLOUDS);

			this.data[i*vals + 0] = data[c_i].x + 
				randPos()*CLOUD_SIZE_X*data[c_i].scale;//x
			this.data[i*vals + 1] = data[c_i].y + 
				randPos()*CLOUD_SIZE_Y*data[c_i].scale;//yy

			var rand = 1.0 - gauss(2);
			this.data[i*vals + 2] = rand * CLOUD_SIZE_X * data[c_i].scale + 0.05;//scale

			this.data[i*vals + 3] = data[c_i].lightness * data[c_i].tint[0];//r
			this.data[i*vals + 4] = data[c_i].lightness * data[c_i].tint[1];//g
			this.data[i*vals + 5] = data[c_i].lightness * data[c_i].tint[2];//b
			this.data[i*vals + 6] = Math.pow(1.0-rand, 2)*0.9 + 0.1;//a;

			this.velocities_data[i*2+0] = data[c_i].speed_factor * MAX_CLOUD_SPEED;
			this.velocities_data[i*2+1] = data[c_i].speed_factor * MAX_CLOUD_SPEED * 0.05;
		}
	}

	destroy() {
		super.destroy();
	}
}