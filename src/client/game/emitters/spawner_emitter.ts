///<reference path="../../engine/graphics.ts"/>

// const SpawnerEmitter = (function() {
namespace Emitters {
	if(typeof GRAPHICS === 'undefined')
		throw "GRAPHICS module must be loaded before Renderer.WebGL";
	var Graphics = GRAPHICS;
	
	const PARTICLES = 100;
	const vals = Graphics.Emitter.VALUES_PER_PARTICLE;

	//SCALE = EnemySpawner.SCALE
	const /*SCALE = 0.15, */SPEED = 0.1, ALPHA = 0.15;

	//let gauss = n => Math.random() * (n <= 1 ? 1 : gauss(n-1));

	var i;

	export class Spawner extends Graphics.Emitter {
		private angles: Float32Array;

		constructor(green: boolean) {
			super('fussion_particle', PARTICLES, true);

			this.angles = new Float32Array(PARTICLES);

			for(i=0; i<PARTICLES; i++) {
				this.data[i*vals + 0] = 1e8;//(Math.random() * 2.0 - 1.0) * Graphics.getAspect();//x
				this.data[i*vals + 1] = 1e8;//Math.random() * 2.0 - 1.0;//yy
				this.data[i*vals + 2] = 0.05 * Math.random() + 0.025;

				this.angles[i] = Math.random() * Math.PI * 2.0;

				this.data[i*vals + 3] = green ? 0.5 : 1.0;//r
				this.data[i*vals + 4] = green ? 1.0 : 0.6;//g
				this.data[i*vals + 5] = green ? 0.3 : 0.4;//b
				this.data[i*vals + 6] = ALPHA * Math.random();
			}
		}

		destroy() {
			//@ts-ignore
			this.angles = null;
			super.destroy();
		}

		update(delta: number, x: number, y: number, vanishing: boolean) {
			for(i=0; i<PARTICLES; i++) {
				if((this.data[i*vals + 6] -= delta*0.08) <= 0) {
					if(vanishing)
						this.data[i*vals + 6] = 0;
					else {
						this.data[i*vals + 6] += ALPHA;
						this.data[i*vals + 0] = x;
						this.data[i*vals + 1] = y;
					}
				}
				else {
					this.data[i*vals + 0] += Math.cos(this.angles[i]) * delta * SPEED;
					this.data[i*vals + 1] += Math.sin(this.angles[i]) * delta * SPEED;
				}
			}
		}
	}
}//)();