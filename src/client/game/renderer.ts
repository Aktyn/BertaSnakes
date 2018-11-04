///<reference path="../common/utils.ts"/>
///<reference path="entities.ts"/>
///<reference path="../engine/graphics.ts"/>
///<reference path="../engine/assets.ts"/>

///<reference path="emitters/dust_emitter.ts"/>
///<reference path="emitters/snow_emitter.ts"/>

// const Renderer = (function() {
namespace Renderer {
	const rect_data = {
		vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
		faces: 	[0, 1, 2, 0, 2, 3]
	};

	var shadow_vector = new Vector.Vec2f();
	shadow_vector.set( -$$.getScreenSize().height, $$.getScreenSize().width ).normalize();
	var windowHeight = $$.getScreenSize().height;

	function onResize(e: Event) {
		//@ts-ignore
		var w = (e.srcElement || e.currentTarget).innerWidth,
		//@ts-ignore
			h = (e.srcElement || e.currentTarget).innerHeight;
		GRAPHICS.onResize(w, h);
		shadow_vector.set(-h, w).normalize();
		windowHeight = h;
	}

	//performance matter variables
	var chunk_it, chunk_ref, e_i;//chunk iterator

	var current_instance: Renderer.Class | null = null;//stores lastly created instance

	export class Class extends Entities {
		public GUI: InGameGUI;
		private VBO_RECT: GRAPHICS.VBO_I;
		private map: GameMap.Map;
		public focused: any;

		private camera: VectorScope.Vector;
		private _zoom: number;

		private main_fb: GRAPHICS.ExtendedFramebuffer;
		private paint_fb: GRAPHICS.ExtendedFramebuffer;
		private main_shader: GRAPHICS.ExtendedShader;
		private post_shader: GRAPHICS.ExtendedShader;
		private particles_shader: GRAPHICS.ExtendedShader;
		private emitters: GRAPHICS.Emitter[];//GraphicsScope.Modules.Emitter[];
		private paint_emitters: GRAPHICS.Emitter[];//GraphicsScope.Modules.Emitter[];
		private weather_emitter: GRAPHICS.Emitter | null;//Emitters.Dust;
		private ready: boolean;

		private background_texture: GRAPHICS.ExtendedTexture;
		private background_scale: number;

		constructor(map: GameMap.Map, map_data: MapJSON_I) {
			$$.assert(current_instance === null, 'Only single instance of Renderer is allowed');
			//$$.assert(map instanceof GameMap, 'map argument must be instance of GameMap');
			if(ASSETS.loaded() !== true)
				throw new Error('Game assets are not loaded');

			const game_canvas = GRAPHICS.init();
			//@ts-ignore
			var rect = GRAPHICS.VBO.create(rect_data);

			super(rect);
			
			this.GUI = new InGameGUI();

			//this.background_test = GRAPHICS.TEXTURES.createFrom(
			//	ASSETS.getTexture('background_test'), true);
			this.background_texture = GRAPHICS.TEXTURES.createFrom(
				map_data['background_texture'], map_data['smooth_background']
			);
			this.background_scale = map_data['background_scale'];

			this.VBO_RECT = rect;
			this.map = map;//handle to map instance
			this.focused = null;//handle to focused player

			//console.log( map_data );

			$$(window).on('resize', onResize);

			this.camera = new Vector.Vec3f(0, 0, 1);
			this._zoom = 0.8;

			// $$(window).on('wheel', e => this.zoom(e.wheelDelta / 120));
			//@ts-ignore
			game_canvas.on('wheel', (e) => this.zoom((<WheelEvent>e).wheelDelta / 120));

			let drag_data = {x: 0, y: 0, dragging: false};
			//@ts-ignore
			game_canvas.on('mousedown', e => {
				drag_data.x = (<MouseEvent>e).clientX;
				drag_data.y = (<MouseEvent>e).clientY;
				drag_data.dragging = true;
			});
			//@ts-ignore
			game_canvas.on('mouseup', e => drag_data.dragging = false);
			//@ts-ignore
			game_canvas.on('mouseout', e => drag_data.dragging = false);

			//@ts-ignore
			game_canvas.on('mousemove', e => {
				if(drag_data.dragging !== true)
					return;

				if(this.focused === null) {
					this.freeMoveCamera((<MouseEvent>e).clientX - drag_data.x, 
						(<MouseEvent>e).clientY - drag_data.y);
				}

				drag_data.x = (<MouseEvent>e).clientX;
				drag_data.y = (<MouseEvent>e).clientY;
			});

			
			this.main_fb = GRAPHICS.FRAMEBUFFERS.create({fullscreen: true, linear: true});
			this.paint_fb = GRAPHICS.FRAMEBUFFERS.create({fullscreen: true, linear: true});

			
			this.main_shader = GRAPHICS.SHADERS.create( ASSETS.getShaderSources('main_shader') );
			this.post_shader = GRAPHICS.SHADERS.create( ASSETS.getShaderSources('post_shader') );
			this.particles_shader = 
				GRAPHICS.SHADERS.create( ASSETS.getShaderSources('particles_shader') );

			this.emitters = [];
			this.paint_emitters = [];

			if(SETTINGS.weather_particles) {
				switch(map_data['weather']) {
					default:
					case 'dust':
						this.weather_emitter = new Emitters.Dust();
						break;
					case 'snow':
						this.weather_emitter = new Emitters.Snow();
						break;
				}

				this.emitters.push( this.weather_emitter );
			}
			else
				this.weather_emitter = null;

			this.ready = true;

			current_instance = this;
		}

		destroy() {
			current_instance = null;

			super.destroy();//Entities class destructor
			//destroying objects
			[
				this.VBO_RECT, this.main_shader, this.post_shader, 
				this.main_fb, this.paint_fb, ...this.emitters, ...this.paint_emitters
				//@ts-ignore
			].forEach((obj: GraphicsScope.Modules.Emitter) => {
				if(obj)	obj.destroy();
			});
			//this.chunks_handlers.forEach(ch => ch.destroy());
			
			$$(window).off('resize', onResize);

			GRAPHICS.destroy();
		}

		withinVisibleArea(x: number, y: number, offset: number) {
			var a = GRAPHICS.getAspect();
			//var cam_max = this.map.map_size - 1/this.camera.z;
			//var cam_max_a = this.map.map_size - GRAPHICS.getAspect()/this.camera.z;
			return 	x+offset > this.camera.x - a/this.camera.z && 
					x-offset < this.camera.x + a/this.camera.z &&
					y+offset > this.camera.y - 1.0/this.camera.z &&
					y-offset < this.camera.y + 1.0/this.camera.z;
		}

		focusOn(player: typeof Player) {//@player - instance of Player
			this.focused = player;
		}

		zoom(factor: number) {
			if(this.focused === null)//free camera
				this._zoom = Math.min(1, Math.max(1 / this.map.map_size, this._zoom + factor * 0.1));
		}

		freeMoveCamera(pixX: number, pixY: number) {
			var factor = (this.map.map_size - 1) / 2.0 / this.camera.z;
			this.camera.x -= pixX / GRAPHICS.getHeight() * factor;
			this.camera.y += pixY / GRAPHICS.getHeight() * factor;
		}

		updateCamera(delta: number) {
			var a = GRAPHICS.getAspect();
			var sqrtA = Math.sqrt(a);
			//console.log(sqrtA);

			if(this._zoom*sqrtA !== this.camera.z) {
				
				this.camera.z += (this._zoom*sqrtA - this.camera.z) * delta * 6.0;

				// if(Math.abs(this.camera.z - this.zoom) < 0.001)
				if(Math.abs(this.camera.z - this._zoom*sqrtA) < 0.001)
					this.camera.z = this._zoom*sqrtA;
			}
			if(this.focused !== null) {
				var dtx = this.focused.x - this.camera.x;
				var dty = this.focused.y - this.camera.y;
				//TODO - multiple by smoothing value instad of const
				this.camera.x += dtx * delta * 3.0 * this.camera.z;
				this.camera.y += dty * delta * 3.0 * this.camera.z;
			}
			//else
			///	this.camera.set(this.focused.x, this.focused.y);//camera movement without smoothing

			//clamping to edges
			
			var cam_max = this.map.map_size - 1/this.camera.z;
			var cam_max_a = this.map.map_size - a/this.camera.z;
			if(this.camera.y > cam_max)
				this.camera.y = cam_max;
			else if(this.camera.y < -cam_max)
				this.camera.y = -cam_max;
			
			if(this.camera.z * this.map.map_size > a) {
				if(this.camera.x > cam_max_a)
					this.camera.x = cam_max_a;
				else if(this.camera.x < -cam_max_a)
					this.camera.x = -cam_max_a;
			}
			else
				this.camera.x = 0;
		}

		prepareSceneFramebuffer() {
			GRAPHICS.clear(0, 0, 0);
			this.main_shader.bind();
			this.VBO_RECT.bind();

			GRAPHICS.TEXTURES.active(0);
			GRAPHICS.SHADERS.uniform_int('sampler', 0);

			GRAPHICS.SHADERS.uniform_float('aspect', GRAPHICS.getAspect());
			GRAPHICS.SHADERS.uniform_vec3('camera', <Float32Array>this.camera.buffer);
		}

		drawForegroundEntities() {
			super.drawLayer( Entities.LAYERS.FOREGROUND );
		}

		drawPaintLayerEntities() {
			super.drawLayer( Entities.LAYERS.PAINT );
		}

		drawParticles(list: /*GraphicsScope.Modules.Emitter[]*/any) {
			this.particles_shader.bind();

			GRAPHICS.SHADERS.uniform_float('screen_height', windowHeight);
			GRAPHICS.SHADERS.uniform_float('aspect', GRAPHICS.getAspect());
			GRAPHICS.SHADERS.uniform_vec3('camera', <Float32Array>this.camera.buffer);

			//console.log('emitters:', this.emitters.length);
			for(e_i=0; e_i<list.length; e_i++) {
				if(list[e_i].expired === true) {
					list[e_i].destroy();
					list.splice(e_i, 1);
					e_i--;
				}
				else if(list[e_i].visible === true)
					list[e_i].draw();
			}
		}

		draw(delta: number) {
			if(!this.ready)
				return;

			if(delta <= 0.5) {
				if(this.focused !== null)
					this.GUI.update( this.focused, delta );
				this.updateCamera(delta);

				if(this.weather_emitter !== null)
					this.weather_emitter.update(delta, this.camera);
			}

			//GRAPHICS.clear(255/256, 144/256, 156/256);

			this.main_fb.renderToTexture();
				this.prepareSceneFramebuffer();
				this.drawForegroundEntities();
			this.main_fb.stopRenderingToTexture();

			this.paint_fb.renderToTexture();
				this.prepareSceneFramebuffer();
				//@ts-ignore
				GRAPHICS.SHADERS.uniform_vec4('color', Colors.WHITE.buffer);

				//for(chunk_it of this.map.chunks) {
				var cam_w = GRAPHICS.getAspect()/this.camera.z,
					cam_h = 1/this.camera.z;
				for(chunk_it=0; chunk_it<this.map.chunks.length; chunk_it++) {
					chunk_ref = this.map.chunks[chunk_it];

					//skipping chunks invisible to camera
					if(chunk_ref.matrix.x+chunk_ref.matrix.width < this.camera.x-cam_w 	||
					chunk_ref.matrix.x-chunk_ref.matrix.width > this.camera.x+cam_w 	||
					chunk_ref.matrix.y+chunk_ref.matrix.height < this.camera.y-cam_h 	||
					chunk_ref.matrix.y-chunk_ref.matrix.height > this.camera.y+cam_h) {
						if(chunk_ref.webgl_texture != null)
							continue;
					}

					if(chunk_ref.need_update) {//updating webgl texture
						//console.log('updating chunk:', chunk_ref);
						chunk_ref.need_update = false;

						if(chunk_ref.webgl_texture == null) {//generate texture for the first time
							chunk_ref.webgl_texture =
								//@ts-ignore
								GRAPHICS.TEXTURES.createFrom(chunk_ref.canvas, true/*, true*/);
							//this.chunks_handlers.push( chunk_ref.webgl_texture );

							//chunk_ref.buff = chunk_ref.ctx.getImageData(0, 0, 
							//	chunk_ref.canvas.width, chunk_ref.canvas.height);
							//chunk_ref.webgl_texture.createFramebuffer();//allows to read pixels
						}
						else {
							//console.time('chunk update');
							/*chunk_ref.buff = chunk_ref.ctx.getImageData(0, 0, 
								chunk_ref.canvas.width, chunk_ref.canvas.height);
							chunk_ref.webgl_texture.update( chunk_ref.buff );*/

							chunk_ref.webgl_texture.update( chunk_ref.canvas, true );
							
							//console.timeEnd('chunk update');
						}
					}

					chunk_ref.webgl_texture.bind();
					//@ts-ignore
					GRAPHICS.SHADERS.uniform_mat3('u_matrix', <Float32Array>chunk_ref.matrix.buffer);
					this.VBO_RECT.draw();
				}

				this.drawPaintLayerEntities();

				this.drawParticles( this.paint_emitters );
			this.paint_fb.stopRenderingToTexture();

			this.post_shader.bind();
			this.VBO_RECT.bind();

			//drawing scene entities
			GRAPHICS.TEXTURES.active(0);
			GRAPHICS.SHADERS.uniform_int('scene_pass', 0);
			this.main_fb.bindTexture();

			//drawing paint layer
			GRAPHICS.TEXTURES.active(1);
			GRAPHICS.SHADERS.uniform_int('curves_pass', 1);
			this.paint_fb.bindTexture();

			GRAPHICS.TEXTURES.active(2);
			GRAPHICS.SHADERS.uniform_int('background_texture', 2);
			this.background_texture.bind();
			
			//GRAPHICS.SHADERS.uniform_vec3('background_color', 
			//	<Float32Array>this.map.background.buffer);
			GRAPHICS.SHADERS.uniform_float('background_scale', this.background_scale);

			GRAPHICS.SHADERS.uniform_vec2('offset', <Float32Array>shadow_vector.buffer);
			// GRAPHICS.SHADERS.uniform_float('shadow_length', 0.1 * this.camera.z);
			// GRAPHICS.SHADERS.uniform_float('zoom_factor', this.camera.z);
			GRAPHICS.SHADERS.uniform_vec3('camera', <Float32Array>this.camera.buffer);
			GRAPHICS.SHADERS.uniform_float('aspect', GRAPHICS.getAspect());

			this.VBO_RECT.draw();

			this.drawParticles( this.emitters );
		}

		/*static get CURRENT_EMITTERS() {
			if(current_instance == null)
				return null;
			return current_instance.emitters;
		}*/
		static getCurrentInstance(): Class {
			if(current_instance === null)
				throw "No current instance";
			return current_instance;
		}

		static addEmitter(emitter: GRAPHICS.Emitter, paint_layer = false) {
			if(current_instance === null)
				throw "No Renderer instance";
				
			if(paint_layer === true)
				current_instance.paint_emitters.push( emitter );
			else
				current_instance.emitters.push( emitter );
			return emitter;
		}
	};
}//)();