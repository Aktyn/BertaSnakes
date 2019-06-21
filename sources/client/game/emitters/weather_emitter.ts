import {Emitter, getAspect} from '../engine/graphics';
import {Vec3f} from '../../../common/utils/vector';

const vals = Emitter.VALUES_PER_PARTICLE;
const PARALLAX = 0.2;

var aspect: number, i: number;

export default class WeatherEmitter extends Emitter {
	protected velocities_data: Float32Array;
	private lastCameraPos: Vec3f = new Vec3f(0, 0, 0);

	constructor(name: string, particles_count: number, is_additive = true) {
		super(name, particles_count, is_additive);

		this.velocities_data = new Float32Array(particles_count * 2);
	}

	destroy() {
		//@ts-ignore
		this.velocities_data = null;//free memory
		super.destroy();
	}

	update(delta: number, camera: Vec3f) {
		aspect = getAspect();

		for(i=0; i<this.count; i++) {
			this.data[i*vals + 0] += this.velocities_data[i*2+0] * delta - 
				(camera.x-this.lastCameraPos.x) * PARALLAX;
			this.data[i*vals + 1] += this.velocities_data[i*2+1] * delta -
				(camera.y-this.lastCameraPos.y) * PARALLAX;

			if( this.data[i*vals + 0] > camera.x + aspect/camera.z )
				this.data[i*vals + 0] -= aspect/camera.z * 2.0;
			if( this.data[i*vals + 0] < camera.x -aspect/camera.z )
				this.data[i*vals + 0] += aspect/camera.z * 2.0;
			if( this.data[i*vals + 1] > camera.y + 1.0/camera.z )
				this.data[i*vals + 1] -= 2.0/camera.z;
			if( this.data[i*vals + 1] < camera.y - 1.0/camera.z )
				this.data[i*vals + 1] += 2.0/camera.z;
		}

		this.lastCameraPos.set(camera.x, camera.y, camera.z);
	}
}