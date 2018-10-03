const Renderer = (function() {
	const rect_data = {
		vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
		faces: 	[0, 1, 2, 0, 2, 3]
	};

	var shadow_vector = new Vector.Vec2f();
	shadow_vector.set( -$$.getScreenSize().height, $$.getScreenSize().width ).normalize();
	var windowHeight = $$.getScreenSize().height;

	function onResize(e) {
		var w = (e.srcElement || e.currentTarget).innerWidth,
			h = (e.srcElement || e.currentTarget).innerHeight;
		GRAPHICS.onResize(w, h);
		shadow_vector.set(-h, w).normalize();
		windowHeight = h;
	}

	//performance matter variables
	var chunk_it, chunk_ref, e_i;//chunk iterator

	var current_instance = null;//stores lastly created instance

	return class extends Entities {
		constructor(map) {
			$$.assert(current_instance == null, 'Only single instance of Renderer is allowed');
			$$.assert(map instanceof GameMap, 'map argument must be instance of GameMap');
			if(ASSETS.loaded() !== true)
				throw new Error('Game assets are not loaded');

			const game_canvas = GRAPHICS.init();
			var rect = GRAPHICS.VBO.create(rect_data);

			super(rect);
			
			this.GUI = new InGameGUI();

			this.VBO_RECT = rect;
			this.map = map;//handle to map instance
			this.focused = null;//handle to focused player

			$$(window).on('resize', onResize);

			this.camera = new Vector.Vec3f(0, 0, 1);
			this._zoom = 1;

			// $$(window).on('wheel', e => this.zoom(e.wheelDelta / 120));
			game_canvas.on('wheel', e => this.zoom(e.wheelDelta / 120));

			let drag_data = {x: 0, y: 0, dragging: false};
			game_canvas.on('mousedown', e => {
				drag_data.x = e.clientX;
				drag_data.y = e.clientY;
				drag_data.dragging = true;
			});

			game_canvas.on('mouseup', e => drag_data.dragging = false);
			game_canvas.on('mouseout', e => drag_data.dragging = false);

			game_canvas.on('mousemove', e => {
				if(drag_data.dragging !== true)
					return;

				if(this.focused === null)
					this.freeMoveCamera(e.clientX - drag_data.x, e.clientY - drag_data.y);

				drag_data.x = e.clientX;
				drag_data.y = e.clientY;
			});

			this.main_fb = GRAPHICS.FRAMEBUFFERS.create({fullscreen: true, linear: true});
			this.paint_fb = GRAPHICS.FRAMEBUFFERS.create({fullscreen: true, linear: true});

			this.main_shader = GRAPHICS.SHADERS.create( ASSETS.getShaderSources('main_shader') );
			this.post_shader = GRAPHICS.SHADERS.create( ASSETS.getShaderSources('post_shader') );
			this.particles_shader = 
				GRAPHICS.SHADERS.create( ASSETS.getShaderSources('particles_shader') );

			this.emitters = [];
			this.paint_emitters = [];

			this.dust_emitter = new DustEmitter();
			this.emitters.push( this.dust_emitter );

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
			].forEach(obj => {
				if(obj)	obj.destroy();
			});
			//this.chunks_handlers.forEach(ch => ch.destroy());
			
			$$(window).off('resize', onResize);

			GRAPHICS.destroy();
		}

		withinVisibleArea(x, y, offset) {
			var a = GRAPHICS.getAspect();
			//var cam_max = this.map.map_size - 1/this.camera.z;
			//var cam_max_a = this.map.map_size - GRAPHICS.getAspect()/this.camera.z;
			return 	x+offset > this.camera.x - a/this.camera.z && 
					x-offset < this.camera.x + a/this.camera.z &&
					y+offset > this.camera.y - 1.0/this.camera.z &&
					y-offset < this.camera.y + 1.0/this.camera.z;
		}

		focusOn(player) {//@player - instance of Player
			this.focused = player;
		}

		zoom(factor) {
			if(this.focused === null)//free camera
				this._zoom = Math.min(1, Math.max(1 / this.map.map_size, this._zoom + factor * 0.1));
		}

		freeMoveCamera(pixX, pixY) {
			var factor = (this.map.map_size - 1) / 2.0 / this.camera.z;
			this.camera.x -= pixX / GRAPHICS.getHeight() * factor;
			this.camera.y += pixY / GRAPHICS.getHeight() * factor;
		}

		updateCamera(delta) {
			if(this._zoom !== this.camera.z) {
				this.camera.z += (this._zoom - this.camera.z) * delta * 6.0;

				if(Math.abs(this.camera.z - this.zoom) < 0.001)
					this.camera.z = this._zoom;
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
			var a = GRAPHICS.getAspect();
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
			GRAPHICS.SHADERS.uniform_vec3('camera', this.camera.buffer);
		}

		drawForegroundEntities() {
			super.drawLayer( Entities.LAYERS.FOREGROUND );
		}

		drawPaintLayerEntities() {
			super.drawLayer( Entities.LAYERS.PAINT );
		}

		drawParticles(list) {
			this.particles_shader.bind();
			GRAPHICS.SHADERS.uniform_float('screen_height', windowHeight);
			GRAPHICS.SHADERS.uniform_float('aspect', GRAPHICS.getAspect());
			GRAPHICS.SHADERS.uniform_vec3('camera', this.camera.buffer);

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

		draw(delta) {
			if(!this.ready)
				return;

			if(delta <= 0.5) {
				if(this.focused !== null)
					this.GUI.update( this.focused, delta );
				this.updateCamera(delta);

				this.dust_emitter.update(delta, this.camera);
			}

			//GRAPHICS.clear(255/256, 144/256, 156/256);

			this.main_fb.renderToTexture();
				this.prepareSceneFramebuffer();
				this.drawForegroundEntities();
			this.main_fb.stopRenderingToTexture();

			this.paint_fb.renderToTexture();
				this.prepareSceneFramebuffer();
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
								GRAPHICS.TEXTURES.createFrom(chunk_ref.canvas, true, true);
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
					GRAPHICS.SHADERS.uniform_mat3('u_matrix', chunk_ref.matrix.buffer);
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

			GRAPHICS.SHADERS.uniform_vec3('background_color', this.map.background.buffer);

			GRAPHICS.SHADERS.uniform_vec2('offset', shadow_vector.buffer);
			GRAPHICS.SHADERS.uniform_float('shadow_length', 0.1 * this.camera.z);

			this.VBO_RECT.draw();

			this.drawParticles( this.emitters );
		}

		/*static get CURRENT_EMITTERS() {
			if(current_instance == null)
				return null;
			return current_instance.emitters;
		}*/
		static getCurrentInstance() {
			return current_instance;
		}

		static addEmitter(emitter, paint_layer) {
			if(current_instance === null)
				return null;
			if(paint_layer === true)
				current_instance.paint_emitters.push( emitter );
			else
				current_instance.emitters.push( emitter );
			return emitter;
		}
	};
})();