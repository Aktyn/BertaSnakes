///<reference path="../../engine/graphics.ts"/>

// const EnergyBlastEmitter = (function() {
namespace Emitters {
	const PARTICLES = 200;
	const vals = GRAPHICS.Emitter.VALUES_PER_PARTICLE;

	const LIFETIME = 0.8, FADING_TIME = 0.4, ALPHA = 0.3;

	var pow = (n: number) => n*n;

	var i: number, dst: number, fading_factor: number, scale_str: number;

	export class EnergyBlast extends GRAPHICS.Emitter {
		private x: number;
		private y: number;
		private radius: number;
		private timer: number;
		private velocities_data: Float32Array;

		constructor(x: number, y: number, radius: number, color: any) {
			super('fussion_particle', PARTICLES, true);
			// console.log(color.buffer);

			this.x = x;
			this.y = y;
			this.radius = radius*0.75;
			this.timer = 0;

			this.velocities_data = new Float32Array(PARTICLES * 2);

			for(i=0; i<PARTICLES; i++) {
				var rand = Math.random();

				this.data[i*vals + 0] = x;//x
				this.data[i*vals + 1] = y;//yy
				this.data[i*vals + 2] = rand * 0.08 + 0.03;//scale
				//225, 53, 61
				this.data[i*vals + 3] = color.buffer[0];//r
				this.data[i*vals + 4] = color.buffer[1];//g
				this.data[i*vals + 5] = color.buffer[2];//b
				this.data[i*vals + 6] = ALPHA;//a

				var angle = Math.random() * 2.0 * Math.PI;
				var speed = (1.0 - rand) * 0.2 + ( this.radius / (LIFETIME-FADING_TIME) ) * 1.0;

				this.velocities_data[i*2+0] = Math.cos(angle) * speed;
				this.velocities_data[i*2+1] = Math.sin(angle) * speed;
			}
		}

		destroy() {
			//@ts-ignore
			this.velocities_data = null;
			super.destroy();
		}

		update(delta: number) {
			if( (this.timer += delta) >= LIFETIME ) {
				this.expired = true;
				return;
			}

			fading_factor = ( 1.0 - ( (this.timer - (LIFETIME-FADING_TIME)) / FADING_TIME ) );

			for(i=1; i<PARTICLES; i++) {//NOTE - do not update first particle
				this.data[i*vals + 0] += this.velocities_data[i*2+0] * delta;
				this.data[i*vals + 1] += this.velocities_data[i*2+1] * delta;

				dst = pow(this.data[i*vals + 0] - this.x) + pow(this.data[i*vals + 1] - this.y);
				if(dst > this.radius*this.radius) {
					scale_str = (this.data[i*vals + 2] - 0.03) / 0.08 * 0.4;
					this.velocities_data[i*2+0] *= 0.95 - scale_str;
					this.velocities_data[i*2+1] *= 0.95 - scale_str;
					// this.velocities_data[i*2+0] = 0;
					// this.velocities_data[i*2+1] = 0;
					this.data[i*vals + 2] *= 0.95;
				}

				if(this.timer > LIFETIME-FADING_TIME)
					this.data[i*vals + 6] = ALPHA * fading_factor;
			}

			//special case for first particle
			this.data[2] = this.radius*2.0;
			if(this.timer > LIFETIME-FADING_TIME)
				this.data[6] = fading_factor * 0.5;
			else
				this.data[6] = this.timer / (LIFETIME-FADING_TIME) * 0.5;
		}
	}
}//)();