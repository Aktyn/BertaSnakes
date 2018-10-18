///<reference path="../../engine/graphics.ts"/>
///<reference path="../../../include/utils/vector.ts"/>

namespace Emitter {
	const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;

	var aspect: number, i: number;

	export class Weather extends GRAPHICS.Emitter {
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

		update(delta: number, camera: VectorScope.Vector) {
			aspect = GRAPHICS.getAspect();

			for(i=0; i<this.count; i++) {
				this.data[i*vals + 0] += this.velocities_data[i*2+0] * delta;
				this.data[i*vals + 1] += this.velocities_data[i*2+1] * delta;

				if(this.data[i*vals + 0] > aspect + camera.x)
					this.data[i*vals + 0] -= aspect * 2.0;
				if(this.data[i*vals + 0] < -aspect + camera.x)
					this.data[i*vals + 0] += aspect * 2.0;
				if(this.data[i*vals + 1] > 1.0 + camera.y)
					this.data[i*vals + 1] -= 2.0;
				if(this.data[i*vals + 1] < -1.0 + camera.y)
					this.data[i*vals + 1] += 2.0;
			}
		}
	}
}