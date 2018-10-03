const DustBackground = (function() {
	var EffectID = null;//COMMON.generateRandomString(10);

	//pos_x, pos_y, scale, angle, speed (for each particle)
	const PARTICLES_COUNT = 256, VALUES_PER_PARTICLE = 5;
	const PERFORMANCE_SAMPLES = 60;

	var Gaussian = it => it === 1 ? Math.random() : (Math.random()*Gaussian(it-1));

	class Enviroment {
		constructor(id) {
			this.id = id || COMMON.generateRandomString(10);
			this.img1 = $$.create('IMG').attribute('src', 'img/dust.png');
			this.img2 = $$.create('IMG').attribute('src', 'img/fussion.png');

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
				this.time_samples = 0;
				this.time_sum = 0;
			}

			///////////////////////////////////////////////////////////////

			this.click_particles = [];
		}

		update(canv, ctx, delta) {
			delta = Math.min(delta, 1000);
			// ctx.fillStyle = "#fff";
			ctx.clearRect(0, 0, canv.width, canv.height);

			var perf_start = performance.now();

			if(this.particles) {

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

			if(++this.time_samples >= PERFORMANCE_SAMPLES) {//performance check
				this.time_samples = 0;

				//console.log(this.time_sum / PERFORMANCE_SAMPLES);
				if(this.time_sum / PERFORMANCE_SAMPLES > 1.5)//more than x miliseconds - lag
					this.max_particles = ~~Math.min(this.max_particles - 128, this.max_particles*0.8);
				else if(this.time_sum / PERFORMANCE_SAMPLES < 1)
					this.max_particles = Math.min(this.max_particles + 128, this.particles.length);

				this.time_sum = 0;
			}
		}

		onClick(e) {
			if(e.button !== 0 || SETTINGS.menu_click_effect === false)
				return;
			let res = $$.getScreenSize();

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
			if(Stage.getCurrent() instanceof Stage.LOBBY_STAGE === false) {
				console.log('Background effect allowed only in LOBBY_STAGE');
				return;
			}
			console.log('Initializing dust background effect');

			EffectID = COMMON.generateRandomString(10);
			if(document.getElementById('#dust_background_' + EffectID) != null)//already initialized
				return;

			let enviroment = new Enviroment(EffectID);

			var canv = $$.create('CANVAS').attribute('id', 'dust_background_' + EffectID)
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
			var ctx = null;
			$$(document.body).appendAtBeginning(canv);//.setStyle({background: 'none'});

			var onResize = res => {
				$$.expand(canv, res);
				ctx = canv.getContext("2d", {antialias: true});
			};

			window.addEventListener('resize', e => onResize($$.getScreenSize()), false);
			onResize($$.getScreenSize());

			window.addEventListener('mousedown', e => enviroment.onClick(e), false);

			var last = 0, dt = 0;
			var tick = function(timer) {
				dt = timer - last;
				last = timer;

				enviroment.update(canv, ctx, dt);

				if(enviroment.id === EffectID)
					window.requestAnimFrame(tick);
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