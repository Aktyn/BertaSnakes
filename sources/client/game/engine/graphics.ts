import Assets from './assets';
import Utils from '../../utils/utils';

var CANVAS: HTMLCanvasElement, GL: WebGLRenderingContext, EXT: WEBGL_draw_buffers, aspect: number;
var initialized = false;

var fullscreen_framebuffers: ExtendedFramebuffer[] = [];

/*function fixRetinaDisplay(canvas: HTMLCanvasElement, context: WebGLRenderingContext) {
	var devicePixelRatio = window.devicePixelRatio || 1;
	//@ts-ignore
    var backingStoreRatio = context.webkitBackingStorePixelRatio ||
    	//@ts-ignore
        context.mozBackingStorePixelRatio ||
        //@ts-ignore
        context.msBackingStorePixelRatio ||
        //@ts-ignore
        context.oBackingStorePixelRatio ||
        //@ts-ignore
        context.backingStorePixelRatio || 1;

    var ratio = devicePixelRatio / backingStoreRatio;

    if (devicePixelRatio !== backingStoreRatio) {
    	console.log('ratina ratios:', backingStoreRatio, ratio);

        var oldWidth = $$.getScreenSize().width;//canvas.width;
        var oldHeight = $$.getScreenSize().height;//canvas.height;

        console.log(oldWidth, oldHeight);

        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;

        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';

        //context.scale(ratio, ratio);
        context.viewport(0, 0, oldWidth * ratio, oldHeight * ratio);
    }
}*/

function loadContext() {
	try {//premultipliedAlpha
		GL = <WebGLRenderingContext>CANVAS.getContext('webgl', {antialias: true, alpha: false});

		EXT = 	GL.getExtension('WEBGL_draw_buffers') || 
				GL.getExtension("OES_draw_buffer") ||
					GL.getExtension("MOZ_OES_draw_buffer") ||
				GL.getExtension("WEBKIT_OES_draw_buffer");
		if(!GL)
			throw new Error('Cannot aquire webgl context');
		if(!EXT)
			throw new Error('Browser does not support "draw buffers" webgl extention');
	}
	catch(e) {//TODO - check this error on mobiles
		console.error(e);
		//alert('No WebGL support');
	}

	// Turn off rendering to alpha
	GL.colorMask(true, true, true, true);

	GL.enable(GL.BLEND);
	GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
	GL.viewport(0, 0, CANVAS.width, CANVAS.height);

	//if(Device.info.is_mobile)
		//fixRetinaDisplay(CANVAS, GL);
}

//var self = {//common graphic functions
export function init() {
	if(CANVAS && typeof CANVAS.remove === 'function')//removing existing canvas
		CANVAS.remove();
	//creating new one
	/*CANVAS = <HTMLCanvasElement><any>$$.create('canvas')
		.setAttrib('id', 'renderer')
		.setAttrib('moz-opaque', '')
		.setStyle({
			'display': 'inline-block',
			'position': 'fixed',
			'left': '0px',
			'top': '0px',
			'background': 'none',
			'user-select': 'none'
			//'pointerEvents': 'none',
		});*/
	CANVAS = document.createElement('canvas');
	CANVAS.setAttribute('id', 'renderer');
	CANVAS.setAttribute('moz-opaque', '');
	Object.assign(CANVAS.style, {
		'display': 'inline-block',
		'position': 'fixed',
		'left': '0px',
		'top': '0px',
		'background': 'none',
		'user-select': 'none',
		// 'z-index': '-1'
		//'pointerEvents': 'none',
	});
	let screen_size = Utils.getScreenSize();
	//$$.expand(CANVAS, $$.getScreenSize(), true);
	CANVAS.width = screen_size.width;
	CANVAS.height = screen_size.height;
	aspect = screen_size.width / screen_size.height;

	if( !document.body )
		throw new Error('No page body found');
	//document.body.appendAtBeginning(CANVAS);
	document.body.insertBefore(CANVAS, document.body.firstChild);
	//CANVAS.focus();

	loadContext();

	initialized = true;

	//return <$_face><any>CANVAS;
	return CANVAS;
}
export function destroy() {
	initialized = false;
	
	if(CANVAS && typeof CANVAS.remove === 'function')//removing existing canvas
		CANVAS.remove();

	//@ts-ignore
	CANVAS = null;
	//@ts-ignore
	GL = null;
}
export function enableAddiveBlending(enable: boolean) {
	if(enable)
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE);
	else
		GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
}
export function isInitialized() {
	return initialized;
}
export function onResize(width: number, height: number) {
	if(!CANVAS)
		return;
	CANVAS.width = width;
	CANVAS.height = height;
	aspect = width / height;

	for(let fb of fullscreen_framebuffers)
		fb.updateTextureResolution(width, height);

	GL.viewport(0, 0, width, height);
	//fixRetinaDisplay(CANVAS, GL);
	//loadContext();
}
export function getWidth() {
	return CANVAS.width;
}
export function getHeight() {
	return CANVAS.height;
}
export function getAspect() {
	return aspect;
}
export function clear(r: number, g: number, b: number) {
	GL.clearColor(r, g, b, 0);
	GL.clear(GL.COLOR_BUFFER_BIT);
}

//};

//TEXTURES: (function() {
const mipmaps = true;

function powerOfTwo(n: number) {
	return (n & (n - 1)) === 0;
}

export interface ExtendedTexture {
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
  			if(this.webgl_texture !== null)
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
	},*/
	/*createFromCanvas: function(canvas, linear) {
		return this.createFromIMG(canvas, linear);
	},*/
	createFrom: function(image: ImageData | HTMLCanvasElement | HTMLImageElement, linear = true) {
		var texture = GL.createTexture();
		if(texture === null)
			throw "Cannot create WebGLTexture";

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

	active: function(number = 0) {
		GL.activeTexture(GL.TEXTURE0 + number);
	},

	unbind: function() {
		GL.bindTexture(GL.TEXTURE_2D, null);
	}
};
//})(),

interface FramebufferOptions {
	linear: boolean;
	width?: number;
	height?: number;
	fullscreen: boolean;
}

export interface ExtendedFramebuffer {
	framebuffer: WebGLFramebuffer;
	webgl_texture: WebGLTexture;
	linear: boolean;
	updateTextureResolution(w: number, h: number): void;
	renderToTexture(): void;
	stopRenderingToTexture(): void;
	bindTexture(): void;
	destroy(): void;
}

//FRAMEBUFFERS: (function() {
var current_fb: WebGLFramebuffer | null = null;
export const FRAMEBUFFERS = {
	create: function(options: FramebufferOptions): ExtendedFramebuffer {
		let linear = options.linear === undefined ? true : options.linear;//default
		let width = options.width || 0,
			height = options.height || 0;
		if(options.fullscreen === true) {
			width = CANVAS.width;
			height = CANVAS.height;
		}
		//var texturesCount = texturesCount || 1;

		let fb = GL.createFramebuffer();
		if(fb === null)
			throw "Cannot create FrameBuffer";
			
		GL.bindFramebuffer(GL.FRAMEBUFFER, fb);
		
		let texture = GL.createTexture();
		if(texture === null)
			throw "Cannot create WebGLTexture";
			
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

		let framebuffer: ExtendedFramebuffer = {
			framebuffer: fb,
			webgl_texture: texture,
			linear: linear,
			
			//changing framebuffer resolution
			updateTextureResolution: function(w, h) {
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
//})(),

//SHADERS: (function() {
var current_shader_program: WebGLProgram | null = null;

//CREATE GL OBJECT SHADER BY SHADER TYPE AND ITS SOURCE
function get_shader(source: string, type: number) {
	let shader = GL.createShader(type);
	if(shader === null)
		throw "Cannot create WebGLShader";
		
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
		throw "Cannot create SHADER PROGRAM";
		
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

function uniform_loc(name: string) {
	return GL.getUniformLocation(<WebGLProgram>current_shader_program, name);
}

export interface ExtendedShader {
	program: WebGLProgram;
	bind(): void;
	destroy(): void;
}

export const SHADERS = {
	create: function(sources: {vertex_source: string, fragment_source: string}) {
		if(GL === undefined) throw "GL context required";

		let compiled_program = compile_shader(sources.vertex_source, sources.fragment_source);

		return <ExtendedShader>{
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
	uniform_vec4: function(name: string, value: Float32Array) {
		GL.uniform4fv(uniform_loc(name), value);
	},
	uniform_vec3: function(name: string, value: Float32Array) {
		GL.uniform3fv(uniform_loc(name), value);
	},
	uniform_vec2: function(name: string, value: Float32Array) {
		GL.uniform2fv(uniform_loc(name), value);
	},
	uniform_mat3: function(name: string, value: Float32Array) {
		GL.uniformMatrix3fv(uniform_loc(name), false, value);
	}
};
//})(),

//VBO: (function() {
interface VertexBufferI {
	updateData(data: BufferSource): void;
	enableAttribute(attrib_name: string, size: number, stride: number, offset: number): void;
	bind(): void;
	destroy(): void;
	draw(count: number): void;
}

export interface VBO_I {
	faces_len: number;
	bind(): void;
	draw(): void;
	destroy(): void;
}

//var binded: VertexBufferI | VBO_I | null = null;//curently binded VBO
export const VBO = {
	create: function(data: {vertex: number[], faces: number[]}): VBO_I {
		var vertex_buff = GL.createBuffer();
		var faces_buff = GL.createBuffer();

		//VERTEXES:
		GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
		GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data.vertex), GL.STATIC_DRAW);

		//FACES:
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.faces), GL.STATIC_DRAW);

		return <VBO_I>{
			faces_len: data.faces.length,

			bind: function() {
				//binding
				GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
			    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buff);

			    if(current_shader_program === null)
			    	throw "No shader is currently binded";
				
				//SHADERS.getCurrent()		    	
				var _uv = GL.getAttribLocation(current_shader_program, "uv");
				var _position = GL.getAttribLocation(current_shader_program, "position");

				/*bytes(float) * 2values per vertex + 2 offset for uv coords*/
				GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 4*(2+2), 0);
				if(_uv !== -1)
					GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false, 4*(2+2), 4*(2));

				//binded = this;
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
	//@count - number of values (size of buffer in floats)
	createVertexBuffer: function(count: number): VertexBufferI {
		var vertex_buff = GL.createBuffer();

		//if(data != nullptr)
		//	updateData(data, data_length);
		GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
		GL.bufferData(GL.ARRAY_BUFFER, count*4, GL.STATIC_DRAW);

		//glBindBuffer(GL_ARRAY_BUFFER, 0);//unbind

		return <VertexBufferI>{
			updateData: function(data) {//@data - Float32Array
				GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
				//4 - bytes for float
				//GL.bufferData(GL.ARRAY_BUFFER, count, GL.STATIC_DRAW);
				GL.bufferSubData(GL.ARRAY_BUFFER, 0, data);
			},

			enableAttribute: function(attrib_name, size, stride, offset) {
				if(current_shader_program === null)
			    	throw "No shader is currently binded";
				var attrib = GL.getAttribLocation(current_shader_program, attrib_name);
				if(attrib != -1)
					GL.enableVertexAttribArray(attrib);
				GL.vertexAttribPointer(attrib, size, GL.FLOAT, false, 4*(stride), 4*offset);
			},

			bind: function() {
				GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buff);
				//binded = this;
			},

			destroy: function() {
				GL.deleteBuffer(vertex_buff);
			},

			draw: function(count) {
				GL.drawArrays(GL.POINTS, 0, count);
			}
		};
	}
};
//})(),

//Emitter: (function() {//particles emitter base class
const 	POSITION_VALUES = 3,
		COLOR_VALUES  = 4,
		VALUES_PER_PARTICLE = (POSITION_VALUES + COLOR_VALUES);

//@_texture - texture name, @_count - number of particles, @_additive - boolean
export abstract class Emitter {
	//private data_length = 0;
	protected count: number;
	private additive: boolean;
	private buffer: VertexBufferI;

	private texture: any;

	protected data: Float32Array;
	public visible = true;

	public expired = false;
	public timestamp: number | Date = 0;

	constructor(_texture: string, _count: number, _additive = false) {
		//this.data_length = 0;
		this.buffer = VBO.createVertexBuffer(_count * VALUES_PER_PARTICLE);

		this.texture = TEXTURES.createFrom(
			<ImageData><unknown>Assets.getTexture( _texture ), true);//linear filtering
		this.count = _count;
		this.additive = _additive;

		//this.visible = true;

		this.data = new Float32Array(_count * VALUES_PER_PARTICLE);

		//this.expired = false;
		//this.timestamp = undefined;
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
		this.buffer.enableAttribute("position", POSITION_VALUES, VALUES_PER_PARTICLE, 0);
		this.buffer.enableAttribute("color", COLOR_VALUES, 
			VALUES_PER_PARTICLE, POSITION_VALUES);

		//updating data
		this.buffer.updateData(this.data/*, this.count * VALUES_PER_PARTICLE*/);

		//binding texture
		TEXTURES.active(0);
		SHADERS.uniform_int('texture', 0);
		this.texture.bind();

		enableAddiveBlending(this.additive);

		//rendering buffer
		this.buffer.draw(this.count);

		enableAddiveBlending(false);
	}

	public static readonly VALUES_PER_PARTICLE = VALUES_PER_PARTICLE;
};

/*export class CanvasExtended {
	private static instance_id = 0;
	public canvas: HTMLCanvasElement;
	//@ts-ignore
	private ctx: CanvasRenderingContext2D;
	public aspect: number;

	private image_smoothing = true;

	constructor() {
		CanvasExtended.instance_id++;

		this.canvas = <HTMLCanvasElement><any>$$.create('canvas')
			.setAttrib('id', 'renderer#' + CanvasExtended.instance_id)
			.setAttrib('moz-opaque', '')
			.setStyle({
				'display': 'inline-block',
				'position': 'fixed',
				'left': '0px',
				'top': '0px',
				'background': 'none',
				'user-select': 'none'
				//'pointerEvents': 'none'
			});

		$$.expand(this.canvas, $$.getScreenSize(), true);
		this.aspect = $$.getScreenSize().width / $$.getScreenSize().height;

		this.ctx = this.extractContext();

		if($$(document.body) == null)
			throw new Error('No page body found');
		$$(document.body).appendAtBeginning(this.canvas);
	}

	destroy() {
		if(this.canvas && typeof this.canvas.remove === 'function')//removing existing canvas
			this.canvas.remove();
	}

	private extractContext() {
		return <CanvasRenderingContext2D>this.canvas.getContext('2d', 
			{antialias: false, alpha: true});
	}

	setResolution(width: number, height: number) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.ctx = this.extractContext();
	}

	private setImageSmooth(smooth: boolean) {
		if(this.image_smoothing === smooth)
			return;
		this.image_smoothing = smooth;
		//@ts-ignore
		this.ctx['mozImageSmoothingEnabled'] = smooth;
		//@ts-ignore
		this.ctx['webkitImageSmoothingEnabled'] = smooth;
		//@ts-ignore
		this.ctx['msImageSmoothingEnabled'] = smooth;
		this.ctx['imageSmoothingEnabled'] = smooth;
	}

	clear(x: number, y: number, w: number, h: number) {
		this.ctx.clearRect(x, y, w, h);
	}

	clearAll() {
		this.clear(0, 0, this.canvas.width, this.canvas.height);
	}

	drawRect(x: number, y: number, w: number, h: number) {
		this.ctx.fillRect(x, y, w, h);
	}

	drawImage(img: HTMLImageElement | HTMLCanvasElement, 
		x: number, y: number, w: number, h: number, smooth = true) 
	{
		this.setImageSmooth(smooth);
		this.ctx.drawImage(img, x, y, w, h);
	}

	drawImageCentered(img: HTMLImageElement | HTMLCanvasElement, 
		x: number, y: number, w: number, h: number, rot: number, smooth = true) 
	{
		this.setImageSmooth(smooth);

		if(rot !== 0) {
			this.ctx.save();
	        this.ctx.translate(x, y);
	        this.ctx.rotate(rot);
	        this.ctx.translate(-x, -y);
	        this.ctx.drawImage(img, x-w, y-h, w*2, h*2);
	        
	        this.ctx.restore();
		}
		else
			this.ctx.drawImage(img, x-w, y-h, w*2, h*2);
	}

	drawImageAt(img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, smooth = true) {
		this.setImageSmooth(smooth);
		this.ctx.drawImage(img, x, y);
	}

	drawImageFull(img: HTMLImageElement | HTMLCanvasElement, smooth = true) {
		this.drawImage(img, 0, 0, this.canvas.width, this.canvas.height, smooth);
	}
}*/