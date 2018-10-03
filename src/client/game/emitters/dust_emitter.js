const DustEmitter = (function() {
	const PARTICLES = 100;
	const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;

	let gauss = n => Math.random() * (n <= 1 ? 1 : gauss(n-1));

	var aspect, i;

	return class extends GRAPHICS.Emitter {
		constructor() {
			super('fussion_particle', PARTICLES, true);

			this.velocities_data = new Float32Array(PARTICLES * 2);

			for(i=0; i<PARTICLES; i++) {
				this.data[i*vals + 0] = (Math.random() * 2.0 - 1.0) * GRAPHICS.getAspect();//x
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
			this.velocities_data = null;
			super.destroy();
		}

		update(delta, camera) {
			aspect = GRAPHICS.getAspect();

			//for(i=0, j=0; i<PARTICLES_COUNT; i++, j+=VALUES_PER_PARTICLE) {
			for(i=0; i<PARTICLES; i++) {
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
	};
})();