///<reference path="renderer.ts"/>
///<reference path="webgl_entities.ts"/>
///<reference path="emitters/dust_emitter.ts"/>
///<reference path="emitters/snow_emitter.ts"/>

// const Renderer = (function() {
namespace Renderer {
	if(typeof ASSETS === 'undefined')
		throw "ASSETS module must be loaded before Renderer.WebGL";
	var Assets = ASSETS;

	if(typeof GRAPHICS === 'undefined')
		throw "GRAPHICS module must be loaded before Renderer.WebGL";
	var Graphics = GRAPHICS;

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
		Graphics.onResize(w, h);
		shadow_vector.set(-h, w).normalize();
		windowHeight = h;
	}

	//performance matter variables
	var chunk_it, chunk_ref, e_i;//chunk iterator

	export class WebGL extends Renderer.RendererBase {
		private entities: Entities.WebGLEntities;
		private VBO_RECT: GRAPHICS.VBO_I;

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
		//private background_scale: number;

		constructor(map: GameMap.Map, map_data: MapJSON_I) {
			const game_canvas = Graphics.init();

			super(map);

			var rect = Graphics.VBO.create(rect_data);
			this.entities = new Entities.WebGLEntities(rect);
			
			this.background_texture = Graphics.TEXTURES.createFrom(
				map_data['background_texture'], map_data['smooth_background']
			);

			this.VBO_RECT = rect;

			$$(window).on('resize', onResize);
			
			game_canvas.on('wheel', (e) => this.zoom((<WheelEvent>e).wheelDelta / 120));

			let drag_data = {x: 0, y: 0, dragging: false};
			
			game_canvas.on('mousedown', e => {
				drag_data.x = (<MouseEvent>e).clientX;
				drag_data.y = (<MouseEvent>e).clientY;
				drag_data.dragging = true;
			});
			
			game_canvas.on('mouseup', e => drag_data.dragging = false);
			game_canvas.on('mouseout', e => drag_data.dragging = false);

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
			
			this.main_fb = Graphics.FRAMEBUFFERS.create({fullscreen: true, linear: true});
			this.paint_fb = Graphics.FRAMEBUFFERS.create({fullscreen: true, linear: true});
			
			this.main_shader = Graphics.SHADERS.create( Assets.getShaderSources('main_shader') );
			this.post_shader = Graphics.SHADERS.create( Assets.getShaderSources('post_shader') );
			this.particles_shader = 
				Graphics.SHADERS.create( Assets.getShaderSources('particles_shader') );

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
		}

		destroy() {
			super.destroy();
			this.entities.destroy();
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

			Graphics.destroy();
		}

		getAspect() {
			return Graphics.getAspect();
		}

		getHeight() {
			return Graphics.getHeight();
		}

		prepareSceneFramebuffer() {
			Graphics.clear(0, 0, 0);
			this.main_shader.bind();
			this.VBO_RECT.bind();

			Graphics.TEXTURES.active(0);
			Graphics.SHADERS.uniform_int('sampler', 0);

			Graphics.SHADERS.uniform_float('aspect', Graphics.getAspect());
			Graphics.SHADERS.uniform_vec3('camera', <Float32Array>this.camera.buffer);
		}

		drawForegroundEntities() {
			this.entities.drawLayer( Entities.WebGLEntities.LAYERS.FOREGROUND );
		}

		drawPaintLayerEntities() {
			this.entities.drawLayer( Entities.WebGLEntities.LAYERS.PAINT );
		}

		drawParticles(list: /*GraphicsScope.Modules.Emitter[]*/any) {
			this.particles_shader.bind();

			Graphics.SHADERS.uniform_float('screen_height', windowHeight);
			Graphics.SHADERS.uniform_float('aspect', Graphics.getAspect());
			Graphics.SHADERS.uniform_vec3('camera', <Float32Array>this.camera.buffer);

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

			super.draw(delta);
			if(delta <= 0.5) {
				if(this.weather_emitter !== null)
					this.weather_emitter.update(delta, this.camera);
			}

			//Graphics.clear(255/256, 144/256, 156/256);

			this.main_fb.renderToTexture();
				this.prepareSceneFramebuffer();
				this.drawForegroundEntities();
			this.main_fb.stopRenderingToTexture();

			this.paint_fb.renderToTexture();
				this.prepareSceneFramebuffer();
				//@ts-ignore
				Graphics.SHADERS.uniform_vec4('color', Colors.WHITE.buffer);

				//for(chunk_it of this.map.chunks) {
				var cam_w = Graphics.getAspect()/this.camera.z,
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
								Graphics.TEXTURES.createFrom(chunk_ref.canvas, true/*, true*/);
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
					Graphics.SHADERS.uniform_mat3('u_matrix', <Float32Array>chunk_ref.matrix.buffer);
					this.VBO_RECT.draw();
				}

				this.drawPaintLayerEntities();

				this.drawParticles( this.paint_emitters );
			this.paint_fb.stopRenderingToTexture();

			this.post_shader.bind();
			this.VBO_RECT.bind();

			//drawing scene entities
			Graphics.TEXTURES.active(0);
			Graphics.SHADERS.uniform_int('scene_pass', 0);
			this.main_fb.bindTexture();

			//drawing paint layer
			Graphics.TEXTURES.active(1);
			Graphics.SHADERS.uniform_int('curves_pass', 1);
			this.paint_fb.bindTexture();

			Graphics.TEXTURES.active(2);
			Graphics.SHADERS.uniform_int('background_texture', 2);
			this.background_texture.bind();
			
			//Graphics.SHADERS.uniform_vec3('background_color', 
			//	<Float32Array>this.map.background.buffer);
			Graphics.SHADERS.uniform_float('map_scale', this.map.map_size);

			Graphics.SHADERS.uniform_vec2('offset', <Float32Array>shadow_vector.buffer);
			// Graphics.SHADERS.uniform_float('shadow_length', 0.1 * this.camera.z);
			// Graphics.SHADERS.uniform_float('zoom_factor', this.camera.z);
			Graphics.SHADERS.uniform_vec3('camera', <Float32Array>this.camera.buffer);
			Graphics.SHADERS.uniform_float('aspect', Graphics.getAspect());

			this.VBO_RECT.draw();

			this.drawParticles( this.emitters );
		}

		static addEmitter(emitter: GRAPHICS.Emitter, paint_layer = false) {
			var current_instance = <Renderer.WebGL>RendererBase.getCurrentInstance();
			//if(current_instance === null)//already checked in RendererBase
			//	throw "No Renderer instance";
				
			if(paint_layer === true)
				current_instance.paint_emitters.push( emitter );
			else
				current_instance.emitters.push( emitter );
			return emitter;
		}
	}
}//)();