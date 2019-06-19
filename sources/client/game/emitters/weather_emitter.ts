import {Emitter, getAspect} from '../engine/graphics';
import Vector from '../../../common/utils/vector';

const vals = Emitter.VALUES_PER_PARTICLE;

var aspect: number, i: number;

export default class WeatherEmitter extends Emitter {
	protected velocities_data: Float32Array;

	constructor(name: string, particles_count: number, is_additive = true) {
		super(name, particles_count, is_additive);

		this.velocities_data = new Float32Array(particles_count * 2);
	}

	destroy() {
		//@ts-ignore
		this.velocities_data = null;//free memory
		super.destroy();
	}

	update(delta: number, camera: Vector) {
		aspect = getAspect();

		for(i=0; i<this.count; i++) {
			this.data[i*vals + 0] += this.velocities_data[i*2+0] * delta;
			this.data[i*vals + 1] += this.velocities_data[i*2+1] * delta;

			if( this.data[i*vals + 0] > camera.x + aspect/camera.z )
				this.data[i*vals + 0] -= aspect/camera.z * 2.0;
			if( this.data[i*vals + 0] < camera.x -aspect/camera.z )
				this.data[i*vals + 0] += aspect/camera.z * 2.0;
			if( this.data[i*vals + 1] > camera.y + 1.0/camera.z )
				this.data[i*vals + 1] -= 2.0/camera.z;
			if( this.data[i*vals + 1] < camera.y - 1.0/camera.z )
				this.data[i*vals + 1] += 2.0/camera.z;
		}
	}
}