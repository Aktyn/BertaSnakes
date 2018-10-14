///<reference path="../common/common.ts"/>
///<reference path="../common/utils.ts"/>
///<reference path="assets.ts"/>

interface VBO_I {
	faces_len: number;
	bind(): void;
	draw(): void;
	destroy(): void;
}

// const GRAPHICS = (function() {
namespace GraphicsScope {
	interface GraphicsMethods {
		init(): $_face; //HTMLCanvasElement;
		destroy(): void;
		enableAddiveBlending(enable: boolean): void;
		isInitialized(): boolean;
		onResize(width: number, height: number): void;
		getWidth(): number;
		getHeight(): number;
		getAspect(): number;
		clear(r: number, g: number, b: number): void;
	}

	const SESSION_STRING = COMMON.generateRandomString(10);

	var CANVAS: $_face;//HTMLCanvasElement;
	var GL: WebGLRenderingContext;
	var EXT: WEBGL_draw_buffers | null = null;
	var aspect = 1;
	var initialized = false;

	var fullscreen_framebuffers: any[] = [];

	function loadContext() {
		try {		//premultipliedAlpha
			GL = <WebGLRenderingContext>CANVAS.getContext('webgl', {antialias: true, alpha: false});

			if(!GL)
    			throw new Error('Cannot aquire webgl context');

			EXT = 	GL.getExtension('WEBGL_draw_buffers') || 
					GL.getExtension("OES_draw_buffer") ||
 					GL.getExtension("MOZ_OES_draw_buffer") ||
    				GL.getExtension("WEBKIT_OES_draw_buffer");
    		
    		if(!EXT)
    			throw new Error('Browser does not support "draw buffers" webgl extention');
		}
		catch(e) {//TODO - debug this error on mobiles
			console.error(e);
			alert('No WebGL support');
		}

		// Turn off rendering to alpha
		GL.colorMask(true, true, true, true);

		GL.enable(GL.BLEND);
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
		GL.viewport(0, 0, CANVAS.width, CANVAS.height);
	}

	var self_methods: GraphicsMethods = {//common graphic functions
		init: function() {
			if(CANVAS && typeof CANVAS.remove === 'function')//removing existing canvas
				CANVAS.remove();
			//creating new one
			CANVAS = $$.create('CANVAS')//<HTMLCanvasElement><unknown>
				.setAttrib('id', 'renderer#' + SESSION_STRING)
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

			//if($$(document.body) == null)
			//	throw new Error('No page body found');
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
			//@ts-ignore
			CANVAS = null;
			//@ts-ignore
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
		onResize: function(width: number, height: number) {
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
		}
	};

	export namespace Modules {
		//var TEXTURES = (function() {
		const mipmaps = true;

		function powerOfTwo(n: number) {
			return (n & (n - 1)) === 0;
		}

		interface ExtendedTexture {
			webgl_texture: WebGLTexture;
			update(pixels: TexImageSource, linear: boolean): void;
			bind(): void;
			destroy(): void;
		}

		function stitchTextureObject(texture: WebGLTexture): ExtendedTexture {
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

		export const TEXTURES = {
			/*createEmpty: function(width: number, height: number, linear: boolean) {
				var temp_canvas = document.createElement('canvas');
				temp_canvas.width = width;
				temp_canvas.height = height;

				return this.createFromCanvas(temp_canvas, linear);
			},
			createFromCanvas: function(canvas: HTMLCanvasElement, linear: boolean) {
				return this.createFromIMG(canvas, linear);
			},*/
			createFrom: function(image: ImageData|HTMLCanvasElement, linear = true):ExtendedTexture {
				var texture = GL.createTexture();
				if(texture === null)
					throw new Error('Cannot create texture');
				//if(linear === undefined)
				//	linear = true;

				//@ts-ignore
		      	GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
		      	//@ts-ignore
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

			active: function(number: any) {
				GL.activeTexture(GL.TEXTURE0 + (number || 0));
			},

			unbind: function() {
				GL.bindTexture(GL.TEXTURE_2D, null);
			}
		};
		//})();

		interface FramebufferOptions {
			linear?: boolean;
			width?: number;
			height?: number;
			fullscreen?: boolean;
		}
		//var FRAMEBUFFERS = (function() {
		var current_fb: WebGLFramebuffer | null = null;
		export const FRAMEBUFFERS = {
			create: function(options: FramebufferOptions) {
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
				GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, width || 512, height || 512, 0, 
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
					
					//changing framebuffer resolution
					updateTextureResolution: function(w: number, h: number) {
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
		//})();

		//var SHADERS = (function() {
		var current_shader_program: WebGLProgram | null = null;

		//CREATE GL OBJECT SHADER BY SHADER TYPE AND ITS SOURCE
		function get_shader(source: string, type: number): WebGLShader {
			let shader = GL.createShader(type);
			if(shader === null)
				throw new Error('Cannot create shader');
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
		function compile_shader(vertex_source: string, fragment_source: string) {
			var shader_vertex = get_shader(vertex_source, GL.VERTEX_SHADER);
			var shader_fragment = get_shader(fragment_source, GL.FRAGMENT_SHADER);

			if(!shader_vertex || !shader_fragment)
				return false;

			let SHADER_PROGRAM = GL.createProgram();
			if(SHADER_PROGRAM === null)
				throw new Error('Cannot create shader program');
			GL.attachShader(SHADER_PROGRAM, shader_vertex);
			GL.attachShader(SHADER_PROGRAM, shader_fragment);

			GL.linkProgram(SHADER_PROGRAM);

			var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
			var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
			var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
			if(_uv !== -1)
				GL.enableVertexAttribArray(_uv);
			if(_color !== -1)
				GL.enableVertexAttribArray(_color);
			GL.enableVertexAttribArray(_position);

			GL.useProgram(SHADER_PROGRAM);
			return SHADER_PROGRAM;
		}

		function uniform_loc(name: string): WebGLUniformLocation | null {
			//if(!current_shader_program)
			//	return null;
			//@ts-ignore
			return GL.getUniformLocation(current_shader_program, name);
		}

		export const SHADERS = {
			create: function(sources: {vertex_source: string, fragment_source: string}) {
				//$$.assert(GL !== undefined, "GL context required");
				//$$.assert(typeof sources !== undefined && 
				//	typeof sources.vertex_source === 'string' && 
				//	typeof sources.fragment_source === 'string', 'Incorrect argument format');

				let compiled_program = compile_shader(sources.vertex_source, sources.fragment_source);

				$$.assert(!!compiled_program, "Cannot compile shader");

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
			uniform_int: function(name: string, value: number) {
				GL.uniform1i(uniform_loc(name), value);
			},
			uniform_float: function(name: string, value: number) {
				GL.uniform1f(uniform_loc(name), value);
			},

			//accepts Float32Array
			uniform_vec4: function(name: string, value: number[] | Float32Array) {
				GL.uniform4fv(uniform_loc(name), value);
			},
			uniform_vec3: function(name: string, value: number[] | Float32Array) {
				GL.uniform3fv(uniform_loc(name), value);
			},
			uniform_vec2: function(name: string, value: number[] | Float32Array) {
				GL.uniform2fv(uniform_loc(name), value);
			},
			uniform_mat3: function(nam: string, value: number[] | Float32Array) {
				GL.uniformMatrix3fv(uniform_loc(name), false, value);
			}
		};
		//})();

		//var VBO = (function() {
		//@ts-ignore
		var binded: any = null;//curently binded VBO

		interface VertexBufferI {
			updateData(data: Float32Array): void;
			enablesetAttrib(attrib_name: string, size: number, stride: number, offset: number): void;
			bind(): void;
			destroy(): void;
			draw(_count: number): void;
		}	

		export const VBO = {
			create: function(data: {faces: number[], vertex: number[]}): VBO_I {
				//$$.assert(data && data.vertex && data.faces, 'Incorrect data format');

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

					    //if(current_shader_program === null)
					    //	return;

						//@ts-ignore
						var _uv = GL.getAttribLocation(SHADERS.getCurrent(), 
							"uv");
						//@ts-ignore
						var _position = GL.getAttribLocation(SHADERS.getCurrent(), 
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

			//@count - size of buffer in floats (4 bytes)
			createVertexBuffer: function(count: number): VertexBufferI {
				var vertex_buff = GL.createBuffer();

				//if(data != nullptr)
				//	updateData(data, data_length);
				GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
				GL.bufferData(GL.ARRAY_BUFFER, count*4, GL.STATIC_DRAW);

				//glBindBuffer(GL_ARRAY_BUFFER, 0);//unbind

				return {
					updateData: function(data: Float32Array) {
						GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
						//4 - bytes for float
						//GL.bufferData(GL.ARRAY_BUFFER, count, GL.STATIC_DRAW);
						GL.bufferSubData(GL.ARRAY_BUFFER, 0, data);
					},

					enablesetAttrib: function(attrib_name, size, stride, offset) {
						// var attrib = GL.getAttribLocation(SHADERS.getCurrent(), attrib_name);
						//if(current_shader_program === null)
						//	throw new Error('No shader is currently in use');
						//@ts-ignore
						var attrib = GL.getAttribLocation(SHADERS.getCurrent(), attrib_name);
						if(attrib !== -1)
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

					draw: function(_count: number) {//@count - number
						GL.drawArrays(GL.POINTS, 0, _count);
					}
				};
			}
		};
		//})();
	 
		//export var Emitter = (function() {//particles emitter base class
		const 	POSITION_VALUES = 3,
				COLOR_VALUES  = 4,
				VALUES_PER_PARTICLE = (POSITION_VALUES + COLOR_VALUES);

		//@_texture - texture name, @_count - number of particles, @_additive - boolean
		export abstract class Emitter {
			//private data_length = 0;
			private buffer: VertexBufferI;
			private texture: ExtendedTexture;
			private count: number;
			private additive: boolean;
			//private visible = true;
			protected data: Float32Array;

			public expired = false;
			public visible = true;
			public timestamp: number | Date = 0;

			constructor(_texture: string, _count: number, _additive: boolean) {
				// this.data_length = 0;
				this.buffer = VBO.createVertexBuffer(_count * VALUES_PER_PARTICLE);

				this.texture = TEXTURES.createFrom(
					<ImageData><unknown>ASSETS.getTexture( _texture ), true);//linear filtering
				this.count = _count;
				this.additive = _additive || false;

				// this.visible = true;

				this.data = new Float32Array(_count * VALUES_PER_PARTICLE);
			}

			destroy() {
				this.buffer.destroy();
				this.texture.destroy();
				//@ts-ignore
				this.data = null;
			}

			abstract update(delta: number, ...args: any): void;

			draw() {
				//binding
				this.buffer.bind();
				this.buffer.enablesetAttrib("position", POSITION_VALUES, VALUES_PER_PARTICLE, 0);
				this.buffer.enablesetAttrib("color", COLOR_VALUES, 
					VALUES_PER_PARTICLE, POSITION_VALUES);

				//updating data
				this.buffer.updateData(this.data/*, this.count * VALUES_PER_PARTICLE*/);

				//binding texture
				TEXTURES.active(0);
				SHADERS.uniform_int('texture', 0);
				this.texture.bind();

				self_methods.enableAddiveBlending(this.additive);

				//rendering buffer
				this.buffer.draw(this.count);

				self_methods.enableAddiveBlending(false);
			}

			static get VALUES_PER_PARTICLE() {
				return VALUES_PER_PARTICLE;
			}
		}
		//})();
	}

	export const CORE = {...self_methods, ...Modules};
//})();
}

const GRAPHICS = GraphicsScope.CORE;