///<reference path="../../engine/graphics.ts"/>

// const PoisoningEmitter = (function() {
namespace Emitters {
	if(typeof GRAPHICS === 'undefined')
		throw "GRAPHICS module must be loaded before Renderer.WebGL";
	var Graphics = GRAPHICS;
	
	const PARTICLES = 50;
	const vals = Graphics.Emitter.VALUES_PER_PARTICLE;

	const SCALE = 0.08, ALPHA = 0.5, FADING_DURATION = 1, SPEED = 0.1;

	var i: number;

	export class Poisoning extends Graphics.Emitter {
		private x_movements: Float32Array;
		private speeds: Float32Array;

		private parent: Object2D;

		private timer = 0;

		constructor(_parent: Object2D) {
			super('cloud_particle', PARTICLES, true);

			this.parent = _parent;

			this.x_movements = new Float32Array(PARTICLES);
			this.speeds = new Float32Array(PARTICLES);
			this.resetTimer();

			for(i=0; i<PARTICLES; i++) {
				this.data[i*vals + 0] = _parent.x;
				this.data[i*vals + 1] = _parent.y;
				this.data[i*vals + 2] = SCALE;

				this.x_movements[i] = (Math.random() * 2.0 - 1.0) * SPEED * 0.5;
				this.speeds[i] = (Math.random()*0.5 + 0.5);

				this.data[i*vals + 3] = 0.4;//r
				this.data[i*vals + 4] = 1.0;//g
				this.data[i*vals + 5] = 0.2;//b
				this.data[i*vals + 6] = ALPHA * Math.random();
			}
		}

		destroy() {
			//@ts-ignore
			this.x_movements = null;
			//@ts-ignore
			this.speed = null;
			super.destroy();
		}

		resetTimer() {
			this.timer = Effects.TYPES.POISONING.duration + FADING_DURATION;//some offset for fading
		}

		update(delta: number) {
			if( (this.timer -= delta) <= 0 ) {
				this.expired = true;
				return;
			}

			for(i=0; i<PARTICLES; i++) {
				this.data[i*vals + 0] += this.x_movements[i] * delta;
				this.data[i*vals + 1] += this.speeds[i] * SPEED * delta;

				if( (this.data[i*vals + 6] -= delta * this.speeds[i] * 0.45) < 0 ) {
					if(this.timer < FADING_DURATION)
						this.data[i*vals + 6] = 0;
					else {
						this.data[i*vals + 6] += ALPHA;

						this.data[i*vals + 0] = this.parent.x;
						this.data[i*vals + 1] = this.parent.y;
					}
				}
				this.data[i*vals + 2] = (1.0 - this.data[i*vals + 6] / ALPHA) * SCALE;
			}
		}
	}
}//)();