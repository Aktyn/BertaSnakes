///<reference path="common/utils.ts"/>

const DustBackground = (function() {
	var EffectID: string | null = null;//COMMON.generateRandomString(10);

	//pos_x, pos_y, scale, angle, speed (for each particle)
	const PARTICLES_COUNT = 256, VALUES_PER_PARTICLE = 5;
	const PERFORMANCE_SAMPLES = 60;

	var Gaussian = (it: number): number => {
		return it === 1 ? Math.random() : (Math.random()*Gaussian(it-1));
	};

	interface ClickParticleJSON {
		type: number;
		x: number;
		y: number;
		speed: number;
		scale: number;
		alpha: number;
		angle: number;
		lifetime: number;
	}

	class Enviroment {
		public id: string;
		private img1: HTMLImageElement;
		private img2: HTMLImageElement;

		private particles?: Float32Array;
		private click_particles: ClickParticleJSON[];

		private max_particles: number = 0;
		private time_samples: number;
		private time_sum: number;

		constructor(id?: string) {
			this.id = id || COMMON.generateRandomString(10);
			this.img1 = <HTMLImageElement><any>$$.create('IMG').setAttrib('src', 'img/dust.png');
			this.img2 = <HTMLImageElement><any>$$.create('IMG').setAttrib('src', 'img/fussion.png');

			if(SETTINGS.menu_background_effect === true) {
				let res = $$.getScreenSize();

				this.particles = new Float32Array(PARTICLES_COUNT * VALUES_PER_PARTICLE);
				for(var i=0; i<this.particles.length; i+=VALUES_PER_PARTICLE) {
					this.particles[i + 0] = (Math.random()*1.2 - 0.1) * res.width;//x
					this.particles[i + 1] = (Math.random()*1.2 - 0.1) * res.height;//y
					this.particles[i + 2] = Gaussian(3) * 512 + 4;//scale
					this.particles[i + 3] = Math.random() * Math.PI * 2;//angle
					this.particles[i + 4] = Gaussian(4) * 0.06 + 0.01;//speed
				}

				this.max_particles = this.particles.length;// /4;
			}

			this.time_samples = 0;
			this.time_sum = 0;

			///////////////////////////////////////////////////////////////

			this.click_particles = [];
		}

		update(canv: HTMLCanvasElement, ctx: CanvasRenderingContext2D, delta: number) {
			delta = Math.min(delta, 1000);
			// ctx.fillStyle = "#fff";
			ctx.clearRect(0, 0, canv.width, canv.height);

			var perf_start = performance.now();

			if(this.particles && this.max_particles) {

				for(var i=0; i<this.particles.length && i<this.max_particles; i+=VALUES_PER_PARTICLE) {
					// ctx.globalAlpha = 0.1;
					ctx.globalAlpha = Math.pow(1 - this.particles[i+2] / (256+4), 1) * 0.05;

					ctx.drawImage(i < this.particles.length/2 ? this.img1 : this.img2, 
						~~this.particles[i+0], ~~this.particles[i+1], 
						~~this.particles[i+2], ~~this.particles[i+2]);

					this.particles[i+0] += Math.cos(this.particles[i+3]) * delta * this.particles[i+4];
					this.particles[i+1] += Math.sin(this.particles[i+3]) * delta * this.particles[i+4];

					if(this.particles[i+0]+this.particles[i+2] < 0)
						this.particles[i+0] = canv.width;
					if(this.particles[i+0] > canv.width)
						this.particles[i+0] = -this.particles[i+2];

					if(this.particles[i+1]+this.particles[i+2] < 0)
						this.particles[i+1] = canv.height;
					if(this.particles[i+1] > canv.height)
						this.particles[i+1] = -this.particles[i+2];
				}

			}
			
			this.click_particles = this.click_particles.filter(part => {
				part.x += Math.cos(part.angle) * part.speed * delta;
				part.y += Math.sin(part.angle) * part.speed * delta;

				var vanishing_alpha = part.lifetime < 0.4 ? part.lifetime/0.4 : 1;
				ctx.globalAlpha = part.alpha * vanishing_alpha;
				ctx.drawImage(part.type === 1 ? this.img1 : this.img2, 
					part.x, part.y, 
					part.scale, part.scale);
				
				return (part.lifetime -= delta/1000) > 0;
			});

			this.time_sum += performance.now() - perf_start;

			if(++this.time_samples >= PERFORMANCE_SAMPLES && this.particles) {//performance check
				this.time_samples = 0;

				//console.log(this.time_sum / PERFORMANCE_SAMPLES);
				if(this.time_sum / PERFORMANCE_SAMPLES > 1.5)//more than x miliseconds - lag
					this.max_particles = ~~Math.min(this.max_particles - 128, this.max_particles*0.8);
				else if(this.time_sum / PERFORMANCE_SAMPLES < 1)
					this.max_particles = Math.min(this.max_particles + 128, this.particles.length);

				this.time_sum = 0;
			}
		}

		onClick(e: MouseEvent) {
			if(e.button !== 0 || SETTINGS.menu_click_effect === false)
				return;
			//let res = $$.getScreenSize();

			for(var i=0; i<50; i++) {
				var s = Gaussian(2)*32 + 4;
				this.click_particles.push({
					type: Math.random() > 0.5 ? 1 : 0,
					x: e.clientX - s/2,
					y: e.clientY - s/2,
					speed: Gaussian(4) * 0.1 + 0.06,
					scale: s,
					alpha: (1 - s / 36) * 0.5,
					angle: Math.random() * Math.PI * 2,
					lifetime: Math.random() * 0.5 + 0.5
				});
			}
		}
	}

	return {
		init: function() {
			console.log('Initializing dust background effect');

			EffectID = COMMON.generateRandomString(10);
			if(document.getElementById('#dust_background_' + EffectID) != null)//already initialized
				return;

			let enviroment = new Enviroment(EffectID);

			var canv = <HTMLCanvasElement><any>$$.create('CANVAS')
				.setAttrib('id', 'dust_background_' + EffectID)
				.setStyle({
					// "z-index": "-1",
					'display': "inline-block",
					// background: "#000",
					'position': "fixed",
					'margin': "0px",
					'padding': "0px",
					'left': "0px",
					'top': "0px",
					'pointerEvents': "none",
					'mixBlendMode': "overlay"
				});
			var ctx: CanvasRenderingContext2D | null = null;
			$$(document.body).appendAtBeginning(canv);//.setStyle({background: 'none'});

			var onResize = (res: {width: number, height: number}) => {
				$$.expand(canv, res);
				ctx = <CanvasRenderingContext2D>canv.getContext("2d", {antialias: true});
			};

			window.addEventListener('resize', e => onResize($$.getScreenSize()), false);
			onResize($$.getScreenSize());

			window.addEventListener('mousedown', e => enviroment.onClick(e), false);

			var last = 0, dt = 0;
			var tick = function(timer: number) {
				dt = timer - last;
				last = timer;

				enviroment.update(canv, <CanvasRenderingContext2D>ctx, dt);

				if(enviroment.id === EffectID) {
					//@ts-ignore
					window.requestAnimFrame(tick);
				}
				else
					console.log('Dust background effect removed');
			};
			tick(0);
		},
		remove: function() {
			try {
				$$('#dust_background_' + EffectID).remove();
				EffectID = null;
			}
			catch(e) {
				console.log('cannot remove background effect');
			}
		},
		reload: function() {
			this.remove();
			if(SETTINGS.menu_background_effect === true || SETTINGS.menu_click_effect === true)
				this.init();
		}
	};
})();