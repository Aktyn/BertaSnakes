import RendererBase from './renderer';
import WebGLEntities from './webgl_entities';
import {LAYERS} from './entities';
import Assets from './engine/assets';
import Settings from './engine/settings';
import * as Graphics from './engine/graphics';
import {Vec2f} from '../../common/utils/vector';
import Utils from '../utils/utils';
import GameMap from '../../common/game/game_map';
import {MapJSON_I, WEATHER_TYPE} from '../../common/game/maps';
import Colors from '../../common/game/common/colors';

import DustEmitter from './emitters/dust_emitter';
import SnowEmitter from './emitters/snow_emitter';
import CloudsEmitter from './emitters/clouds_emitter';

const rect_data = {
	vertex: [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1],
	faces: 	[0, 1, 2, 0, 2, 3]
};

let screen_size = Utils.getScreenSize();
let enable_particles = true;

let shadow_vector = new Vec2f();
shadow_vector.set( -screen_size.height, screen_size.width ).normalize();
let windowHeight = screen_size.height;

function onResize(event: Event) {
	//@ts-ignore
	let w = event.currentTarget.innerWidth;
	//@ts-ignore
	let h = event.currentTarget.innerHeight;
	Graphics.onResize(w, h);
	shadow_vector.set(-h, w).normalize();
	windowHeight = h;
}

//performance matter variables
let chunk_it, chunk_ref, e_i;//chunk iterator

export default class WebGLRenderer extends RendererBase {
	private entities: WebGLEntities;
	private readonly VBO_RECT: Graphics.VBO_I;

	private readonly main_fb: Graphics.ExtendedFramebuffer;
	private readonly paint_fb: Graphics.ExtendedFramebuffer;
	private readonly main_shader: Graphics.ExtendedShader;
	private readonly post_shader: Graphics.ExtendedShader;
	private readonly particles_shader?: Graphics.ExtendedShader;
	private readonly emitters: Graphics.Emitter[];//GraphicsScope.Modules.Emitter[];
	private readonly paint_emitters: Graphics.Emitter[];//GraphicsScope.Modules.Emitter[];
	private readonly weather_emitter: Graphics.Emitter | null;//Emitters.Dust;
	private readonly ready: boolean;

	private background_texture: Graphics.ExtendedTexture;
	//private background_scale: number;

	constructor(map: GameMap, map_data: MapJSON_I) {
		const game_canvas = Graphics.init();
		super(map);

		enable_particles = !!Settings.getValue('particles');
		let rect = Graphics.VBO.create(rect_data);
		this.entities = new WebGLEntities(rect);
		
		this.background_texture = Graphics.TEXTURES.createFrom(
			map_data['background_texture'], map_data['smooth_background']
		);

		this.VBO_RECT = rect;
		
		window.addEventListener('resize', onResize, true);
		
		//@ts-ignore
		//game_canvas.onwheel = e => this.zoom((e.wheelDelta||-e.detail) / 120);

		let drag_data = {x: 0, y: 0, dragging: false};
		
		game_canvas.onmousedown = e => {
			drag_data.x = e.clientX;
			drag_data.y = e.clientY;
			drag_data.dragging = true;
		};
		
		game_canvas.onmouseup = () => drag_data.dragging = false;
		game_canvas.onmouseout = () => drag_data.dragging = false;

		game_canvas.onmousemove = (e) => {
			if(drag_data.dragging !== true)
				return;

			if(this.focused === null) {
				this.freeMoveCamera(e.clientX - drag_data.x, e.clientY - drag_data.y);
			}

			drag_data.x = e.clientX;
			drag_data.y = e.clientY
		};
		
		this.main_fb = Graphics.FRAMEBUFFERS.create({fullscreen: true, linear: true});
		this.paint_fb = Graphics.FRAMEBUFFERS.create({fullscreen: true, linear: true});
		
		this.main_shader = Graphics.SHADERS.create( Assets.getShaderSources('main_shader') );
		this.post_shader = Graphics.SHADERS.create( Assets.getShaderSources('post_shader') );
		if( enable_particles )
			this.particles_shader = Graphics.SHADERS.create( Assets.getShaderSources('particles_shader') );

		this.emitters = [];
		this.paint_emitters = [];

		if( Settings.getValue('weather_particles') === true && enable_particles ) {
			switch(map_data['weather']) {
				default:
				case WEATHER_TYPE.DUST:
					this.weather_emitter = new DustEmitter();
					break;
				case WEATHER_TYPE.SNOW:
					this.weather_emitter = new SnowEmitter();
					break;
				case WEATHER_TYPE.CLOUDS:
					this.weather_emitter = new CloudsEmitter();
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
		
		window.removeEventListener('onresize', onResize, true);

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
		this.entities.drawLayer( LAYERS.FOREGROUND );
	}

	drawPaintLayerEntities() {
		this.entities.drawLayer( LAYERS.PAINT );
	}

	drawParticles(list: Graphics.Emitter[]) {
		if( !this.particles_shader )
			return;
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
			
			Graphics.SHADERS.uniform_vec4('color', Colors.WHITE.buffer);

			//for(chunk_it of this.map.chunks) {
			let cam_w = Graphics.getAspect()/this.camera.z,
				cam_h = 1/this.camera.z;
			for(chunk_it=0; chunk_it<this.map.chunks.length; chunk_it++) {
				chunk_ref = this.map.chunks[chunk_it];

				//skipping chunks invisible to camera
				if(chunk_ref.matrix.x+chunk_ref.matrix.width < this.camera.x-cam_w 	    ||
					chunk_ref.matrix.x-chunk_ref.matrix.width > this.camera.x+cam_w 	||
					chunk_ref.matrix.y+chunk_ref.matrix.height < this.camera.y-cam_h 	||
					chunk_ref.matrix.y-chunk_ref.matrix.height > this.camera.y+cam_h)
				{
					if(chunk_ref.webgl_texture !== null)//unless chunk texture is not yet generated
						continue;
				}

				if(chunk_ref.need_update) {//updating webgl texture
					//console.log('updating chunk:', chunk_ref);
					chunk_ref.need_update = false;

					if(chunk_ref.webgl_texture == null) {//generate texture for the first time
						chunk_ref.webgl_texture =
							Graphics.TEXTURES.createFrom(chunk_ref.canvas, true);
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

				// @ts-ignore
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

	public static addEmitter(emitter: Graphics.Emitter, paint_layer = false) {
		if( !enable_particles )
			return emitter;
		let current_instance = <WebGLRenderer>RendererBase.getCurrentInstance();
			
		if(paint_layer === true)
			current_instance.paint_emitters.push( emitter );
		else
			current_instance.emitters.push( emitter );
		return emitter;
	}
}