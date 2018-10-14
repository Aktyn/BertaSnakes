const GRAPHICS = (function() {
	const SESSION_STRING = COMMON.generateRandomString(10);

	var CANVAS, GL, EXT, aspect;
	var initialized = false;

	var fullscreen_framebuffers = [];

	function loadContext() {
		try {		//premultipliedAlpha
			GL = CANVAS.getContext('webgl', {antialias: true, alpha: false});

			EXT = 	GL.getExtension('WEBGL_draw_buffers') || 
					GL.getExtension("OES_draw_buffer") ||
 					GL.getExtension("MOZ_OES_draw_buffer") ||
    				GL.getExtension("WEBKIT_OES_draw_buffer");
    		if(!GL)
    			throw new Error('Cannot aquire webgl context');
    		if(!EXT)
    			throw new Error('Browser does not support "draw buffers" webgl extention');
		}
		catch(e) {
			console.error(e);
			alert('No WebGL support');
		}

		// Turn off rendering to alpha
		GL.colorMask(true, true, true, true);

		GL.enable(GL.BLEND);
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
		GL.viewport(0, 0, CANVAS.width, CANVAS.height);
	}

	var self = {//common graphic functions
		init: function() {
			if(CANVAS && typeof CANVAS.remove === 'function')//removing existing canvas
				CANVAS.remove();
			//creating new one
			CANVAS = $$.create('CANVAS').setAttrib('id', 'renderer#' + SESSION_STRING)
				.setAttrib('moz-opaque', '')
				.setStyle({
					'display': 'inline-block',
					'position': 'fixed',
					'left': '0px',
					'top': '0px',
					'background': 'none',
					'user-select': 'none'
					//'pointerEvents': 'none',
				});
			$$.expand(CANVAS, $$.getScreenSize(), true);
			aspect = $$.getScreenSize().width / $$.getScreenSize().height;

			if($$(document.body) == null)
				throw new Error('No page body found');
			$$(document.body).appendAtBeginning(CANVAS);
			//CANVAS.focus();

			loadContext();

			initialized = true;

			return CANVAS;
		},
		destroy: function() {
			initialized = false;
			//console.log("WAAT", CANVAS);
			if(CANVAS && typeof CANVAS.remove === 'function')//removing existing canvas
				CANVAS.remove();
			CANVAS = null;
			GL = null;
		},
		enableAddiveBlending: function(enable) {
			if(enable)
				GL.blendFunc(GL.SRC_ALPHA, GL.ONE);
			else
				GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
		},
		isInitialized: function() {
			return initialized;
		},
		onResize: function(width, height) {
			CANVAS.width = width;
			CANVAS.height = height;
			aspect = width / height;

			for(let fb of fullscreen_framebuffers)
				fb.updateTextureResolution(width, height);

			GL.viewport(0, 0, width, height);
			//loadContext();
		},
		getWidth: function() {
			return CANVAS.width;
		},
		getHeight: function() {
			return CANVAS.height;
		},
		getAspect: function() {
			return aspect;
		},
		clear: function(r, g, b) {
			GL.clearColor(r, g, b, 0);
			GL.clear(GL.COLOR_BUFFER_BIT);
		},

	//};

		TEXTURES: (function() {
			const mipmaps = true;

			function powerOfTwo(n) {
				return (n & (n - 1)) === 0;
			}

			function stitchTextureObject(texture) {
				return {
		      		webgl_texture: texture,
		      		//fb: null,//framebuffer
		      		update: function(pixels, linear) {
		      			this.bind();
		      			
		      			// console.time("texture update test");
		      			// GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
		      			GL.texSubImage2D(GL.TEXTURE_2D, 0, 0, 0, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
		      			GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, 
		      				linear ? GL.LINEAR : GL.NEAREST);
				      	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, 
				      		linear ? GL.LINEAR : GL.NEAREST);
		      			//if(mipmaps)
		      			//	GL.generateMipmap(GL.TEXTURE_2D);
		      			//
		      			// console.timeEnd("texture update test");
		      		},
		      		bind: function() {
		      			GL.bindTexture(GL.TEXTURE_2D, this.webgl_texture);
		      		},
		      		destroy: function() {
		      			if(this.webgl_texture != null)
		      				GL.deleteTexture(this.webgl_texture);
		      			//if(this.fb != null)
		      			//	GL.deleteFramebuffer(this.fb);
		      		}
		      	};
			}

			return {
				createEmpty: function(width, height, linear) {
					var temp_canvas = document.createElement('canvas');
					temp_canvas.width = width;
					temp_canvas.height = height;

					return this.createFromCanvas(temp_canvas, linear);
				},
				/*createFromCanvas: function(canvas, linear) {
					return this.createFromIMG(canvas, linear);
				},*/
				createFrom: function(image, linear) {
					var texture = GL.createTexture();
					if(linear === undefined)
						linear = true;

			      	GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
			      	GL.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

			      	GL.bindTexture(GL.TEXTURE_2D, texture);

			      	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);

			      	//if image width and height are powers of two
			      	var filter = linear ? GL.LINEAR : GL.NEAREST;
			      	if(powerOfTwo(image.width) && powerOfTwo(image.height)) {
			      		var mipmap_filter = linear ? GL.LINEAR_MIPMAP_LINEAR : GL.NEAREST_MIPMAP_NEAREST;
			      		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, filter);
				      	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, 
				      		mipmaps ? mipmap_filter : filter);
				   	}
			      	else {
			      		GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, filter);
				      	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, filter);
			      	}
			      	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
					GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

			      	if(mipmaps)
			      		GL.generateMipmap(GL.TEXTURE_2D);

			      	GL.bindTexture(GL.TEXTURE_2D, null);

			      	return stitchTextureObject(texture);
				},

				active: function(number) {
					GL.activeTexture(GL.TEXTURE0 + (number || 0));
				},

				unbind: function() {
					GL.bindTexture(GL.TEXTURE_2D, null);
				}
			};
		})(),

		FRAMEBUFFERS: (function() {
			var current_fb = null;
			return {
				create: function(options/*name, w, h, linear, texturesCount*/) {
					$$.assert(typeof options === 'object', 'Framebuffer options not specified');

					//console.log('Creating framebuffer with given options:', options);

					let linear = options.linear === undefined ? true : options.linear;//default
					let width = options.width,
						height = options.height;
					if(options.fullscreen === true) {
						width = CANVAS.width;
						height = CANVAS.height;
					}
					//var texturesCount = texturesCount || 1;

					let fb = GL.createFramebuffer();
					GL.bindFramebuffer(GL.FRAMEBUFFER, fb);
					
					let texture = GL.createTexture();
					GL.bindTexture(GL.TEXTURE_2D, texture);
					GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width, height, 0, 
						GL.RGBA, GL.UNSIGNED_BYTE, null);

					GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, 
						linear ? GL.LINEAR : GL.NEAREST);
					GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, 
						linear ? GL.LINEAR : GL.NEAREST);

					GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
					GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
					
					//GL.generateMipmap(GL.TEXTURE_2D);
					//var buffers = [];
					GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, 
						GL.TEXTURE_2D, texture, 0);
					//buffers.push(EXT.COLOR_ATTACHMENT0_WEBGL);//TODO no need to use array ...
					
					//EXT.drawBuffersWEBGL(buffers);//... [EXT.COLOR_ATTACHMENT0_WEBGL] instead of buffers
					GL.bindTexture(GL.TEXTURE_2D, null);
					GL.bindFramebuffer(GL.FRAMEBUFFER, null);

					let framebuffer = {
						framebuffer: fb,
						webgl_texture: texture,
						linear: linear,
						
						updateTextureResolution: function(w, h) {//changing framebuffer resolution
							GL.bindTexture(GL.TEXTURE_2D, this.webgl_texture);
							GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, w, h, 0, 
								GL.RGBA, GL.UNSIGNED_BYTE, null);

							GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, 
								this.linear ? GL.LINEAR : GL.NEAREST);
							GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, 
								this.linear ? GL.LINEAR : GL.NEAREST);

							GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
							GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
						},
						renderToTexture: function() {
							current_fb = this.framebuffer;
							GL.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer);
						},
						stopRenderingToTexture: function() {
							current_fb = null;
							GL.bindFramebuffer(GL.FRAMEBUFFER, null);
						},
						bindTexture: function() {
							GL.bindTexture(GL.TEXTURE_2D, this.webgl_texture);
						},

						destroy: function() {
							GL.deleteFramebuffer(this.framebuffer);
							GL.deleteTexture(this.webgl_texture);

							let index = fullscreen_framebuffers.indexOf(this);
							if(index != -1)
								fullscreen_framebuffers.splice(index, 1);
						}
					};

					if(options.fullscreen === true)
						fullscreen_framebuffers.push(framebuffer);

					return framebuffer;
				},
				getCurrent: function() {
					return current_fb;
				}
			};
		})(),

		SHADERS: (function() {
			var current_shader_program = null;

			//CREATE GL OBJECT SHADER BY SHADER TYPE AND ITS SOURCE
			function get_shader(source, type) {
				let shader = GL.createShader(type);
				GL.shaderSource(shader, source);
				GL.compileShader(shader);
				if(!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
					console.error("ERROR IN " + (type === GL.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") + 
						" SHADER : " + GL.getShaderInfoLog(shader));
					return false;
				}
				return shader;
			}

			//CREATE GL OBJECT SHADER FROM GIVEN SHADER SOURCES
			function compile_shader(vertex_source, fragment_source) {
				var shader_vertex = get_shader(vertex_source, GL.VERTEX_SHADER);
				var shader_fragment = get_shader(fragment_source, GL.FRAGMENT_SHADER);

				if(!shader_vertex || !shader_fragment)
					return false;

				let SHADER_PROGRAM = GL.createProgram();
				GL.attachShader(SHADER_PROGRAM, shader_vertex);
				GL.attachShader(SHADER_PROGRAM, shader_fragment);

				GL.linkProgram(SHADER_PROGRAM);

				var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
				var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
				var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
				if(_uv != -1)
					GL.enableVertexAttribArray(_uv);
				if(_color != -1)
					GL.enableVertexAttribArray(_color);
				GL.enableVertexAttribArray(_position);

				GL.useProgram(SHADER_PROGRAM);
				return SHADER_PROGRAM;
			}

			function uniform_loc(name) {
				return GL.getUniformLocation(current_shader_program, name);
			}

			return {
				create: function(sources) {
					$$.assert(GL !== undefined, "GL context required");
					$$.assert(typeof sources !== undefined && 
						typeof sources.vertex_source === 'string' && 
						typeof sources.fragment_source === 'string', 'Incorrect argument format');

					let compiled_program = compile_shader(sources.vertex_source, sources.fragment_source);

					$$.assert(compiled_program, "Cannot compile shader");

					return {
						program: compiled_program,
						bind: function() {
							GL.useProgram(this.program);
							current_shader_program = this.program;
						},
						destroy: function() {
							GL.deleteProgram(this.program);
						}
					};
				},
				getCurrent: function() {//returns number
					return current_shader_program;
				},

				//UNIFORMS
				uniform_int: function(name, value) {
					GL.uniform1i(uniform_loc(name), value);
				},
				uniform_float: function(name, value) {
					GL.uniform1f(uniform_loc(name), value);
				},

				//accepts Float32Array
				uniform_vec4: function(name, value) {
					GL.uniform4fv(uniform_loc(name), value);
				},
				uniform_vec3: function(name, value) {
					GL.uniform3fv(uniform_loc(name), value);
				},
				uniform_vec2: function(name, value) {
					GL.uniform2fv(uniform_loc(name), value);
				},
				uniform_mat3: function(name, value) {
					GL.uniformMatrix3fv(uniform_loc(name), false, value);
				}
			};
		})(),

		VBO: (function() {
			var binded = null;//curently binded VBO

			return {
				create: function(data) {
					$$.assert(data && data.vertex && data.faces, 'Incorrect data format');

					var vertex_buff = GL.createBuffer();
					var faces_buff = GL.createBuffer();

					//VERTEXES:
					GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
					GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data.vertex), GL.STATIC_DRAW);

					//FACES:
					GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);
					GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.faces), GL.STATIC_DRAW);

					return {
						faces_len: data.faces.length,

						bind: function() {
							//binding
							GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
						    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);
							
							var _uv = GL.getAttribLocation(self.SHADERS.getCurrent(), 
								"uv");
							var _position = GL.getAttribLocation(self.SHADERS.getCurrent(), 
								"position");

							/*bytes(float) * 2values per vertex + 2 offset for uv coords*/
							GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4*(2+2), 0);
							if(_uv !== -1)
								GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4*(2+2), 4*(2));

							binded = this;
						},

						draw: function() {
						    GL.drawElements(GL.TRIANGLE_FAN, this.faces_len, GL.UNSIGNED_SHORT, 0);
						},

						destroy: function() {
							GL.deleteBuffer(vertex_buff);
							GL.deleteBuffer(faces_buff);
						}
					};
					//return vbo;
				},
				createVertexBuffer: function(count) {//@count - number of values (size of buffer in floats)
					var vertex_buff = GL.createBuffer();

					//if(data != nullptr)
					//	updateData(data, data_length);
					GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
					GL.bufferData(GL.ARRAY_BUFFER, count*4, GL.STATIC_DRAW);

					//glBindBuffer(GL_ARRAY_BUFFER, 0);//unbind

					return {
						updateData: function(data/*, data_length*/) {//@data - Float32Array
							GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
							//4 - bytes for float
							//GL.bufferData(GL.ARRAY_BUFFER, count, GL.STATIC_DRAW);
							GL.bufferSubData(GL.ARRAY_BUFFER, 0, data);
						},

						enableAttribute: function(attrib_name, size, stride, offset) {
							var attrib = GL.getAttribLocation(self.SHADERS.getCurrent(), attrib_name);
							if(attrib != -1)
								GL.enableVertexAttribArray(attrib);
							GL.vertexAttribPointer(attrib, size, GL.FLOAT, false, 4*(stride), 4*offset);
						},

						bind: function() {
							GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
							binded = this;
						},

						destroy: function() {
							GL.deleteBuffer(vertex_buff);
						},

						draw: function(_count) {//@count - number
							GL.drawArrays(GL.POINTS, 0, _count);
						}
					};
				}
			};
		})(),

		Emitter: (function() {//particles emitter base class
			const 	POSITION_VALUES = 3,
					COLOR_VALUES  = 4,
					VALUES_PER_PARTICLE = (POSITION_VALUES + COLOR_VALUES);

			return class {//@_texture - texture name, @_count - number of particles, @_additive - boolean
				constructor(_texture, _count, _additive) {
					this.data_length = 0;
					this.buffer = self.VBO.createVertexBuffer(_count * VALUES_PER_PARTICLE);

					this.texture = self.TEXTURES.createFrom(
						ASSETS.getTexture( _texture ), true);//linear filtering
					this.count = _count;
					this.additive = _additive || false;

					this.visible = true;

					this.data = new Float32Array(_count * VALUES_PER_PARTICLE);

					this.expired = false;
					this.timestamp = undefined;
				}

				destroy() {
					this.buffer.destroy();
					this.texture.destroy();
					this.data = null;
				}

				draw() {
					//binding
					this.buffer.bind();
					this.buffer.enableAttribute("position", POSITION_VALUES, VALUES_PER_PARTICLE, 0);
					this.buffer.enableAttribute("color", COLOR_VALUES, 
						VALUES_PER_PARTICLE, POSITION_VALUES);

					//updating data
					this.buffer.updateData(this.data/*, this.count * VALUES_PER_PARTICLE*/);

					//binding texture
					self.TEXTURES.active(0);
					self.SHADERS.uniform_int('texture', 0);
					this.texture.bind();

					self.enableAddiveBlending(this.additive);

					//rendering buffer
					this.buffer.draw(this.count);

					self.enableAddiveBlending(false);
				}

				static get VALUES_PER_PARTICLE() {
					return VALUES_PER_PARTICLE;
				}
			};
		})(),

	};

	return self;
})();