const InstantHealEmitter = (function() {
	const PARTICLES = 40;
	const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;

	const LIFETIME = 2, FADING_TIME = 0.75, ALPHA = 0.3;

	var i, is_fading, fading_alpha = ALPHA;

	return class extends GRAPHICS.Emitter {
		constructor(x, y) {
			super('plus', PARTICLES, true);

			this.velocities_data = new Float32Array(PARTICLES * 2);

			this.timer = 0;

			for(i=0; i<PARTICLES; i++) {
				this.data[i*vals + 0] = x;//
				this.data[i*vals + 1] = y;//
				this.data[i*vals + 2] = Math.random() * 0.01 + 0.01;//

				this.data[i*vals + 3] = 0.5;//r
				this.data[i*vals + 4] = 1.0;//g
				this.data[i*vals + 5] = 0.5;//b
				this.data[i*vals + 6] = ALPHA;

				var angle = Math.random() * 2.0 * Math.PI;
				var speed = Math.random() * 0.1 + 0.1;

				this.velocities_data[i*2+0] = Math.cos(angle) * speed;
				this.velocities_data[i*2+1] = Math.sin(angle) * speed;
			}
		}

		destroy() {
			this.velocities_data = null;
			super.destroy();
		}

		update(delta) {
			if((this.timer += delta) > LIFETIME) {
				this.expired = true;
				return;
			}

			if( (is_fading = this.timer > LIFETIME - FADING_TIME) === true )
				fading_alpha = (1.0 - (this.timer - (LIFETIME-FADING_TIME)) / FADING_TIME) * ALPHA;

			for(i=0; i<PARTICLES; i++) {
				// this.data[i*vals + 0];

				this.data[i*vals + 0] += this.velocities_data[i*2+0] * delta;
				this.data[i*vals + 1] += this.velocities_data[i*2+1] * delta;
				
				if(is_fading)
					this.data[i*vals + 6] = fading_alpha;
			}
		}
	};
})();