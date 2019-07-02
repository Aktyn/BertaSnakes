import {MapJSON_I} from './maps';
import Matrix2D from './../utils/matrix2d';
import Colors from './../game/common/colors';

declare var _CLIENT_: boolean;
if(!_CLIENT_) {
	// noinspection ES6ConvertVarToLetConst
	var Canvas = require('canvas');
	//console.log(Canvas);
}

export interface ChunkSchema {
	matrix: Matrix2D,
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	buff: any, //ctx.getImageData(0, 0, CHUNK_RES, CHUNK_RES)
	//new Uint8Array(CHUNK_RES * CHUNK_RES * 4),
	webgl_texture: any,//for WebGL rendering TODO - assign type to webgl_texture and to buff
	need_update: boolean
}

export const enum PAINTER_RESOLUTION {
	LOW = 64,
	MEDIUM = 128,
	HIGH = 256
}

//CHUNK_RES / CHUNK_SIZE should be 1024 at highest settings
let CHUNK_RES = PAINTER_RESOLUTION.MEDIUM;//resolution of single chunk (256)
//const CHUNK_SIZE = 0.25;//size of a single chunk compared to screen height

const PI_2 = Math.PI * 2.0;

//performance mater variables
let sxi_temp: number, syi_temp: number, sxi: number, syi: number, exi: number, eyi: number,
	xx: number, yy: number, temp: number, itY: number, itX: number, ch_i: number, 
	chunk_ctx: CanvasRenderingContext2D, relXs: number, relYs: number, relXe: number, 
	relYe: number, thick_off: number, rad_off: number, pixel_i: number, ii: number;

let clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const pow2 = (a: number) => a*a;

export default class PaintLayer {
	public static readonly CHUNK_SIZE = 0.25;//const
	public walls_color = Colors.gen(255, 255, 255);

	private _color = '#fff';

	private composite = 'source-over';
	public chunks: ChunkSchema[] = [];

	public map_size = 1;//default
	private walls_thickness = 0;

	public size = 0;

	private spawn_radius = 0;
	private spawn_thickness = 0;

	constructor() {}

	destroy() {
		this.chunks.forEach(ch => {
			if(ch.webgl_texture !== null)
				ch.webgl_texture.destroy();
			delete ch.canvas;
			delete ch.buff;
		});
		//@ts-ignore
		this.chunks = null;
	}

	/*static get CHUNK_RES() {
		return CHUNK_RES;
	}*/
	public static CHUNK_RES = CHUNK_RES;
	/*static get CHUNK_SIZE() {
		return CHUNK_SIZE;
	}*/

	generateChunks(res: PAINTER_RESOLUTION) {
		CHUNK_RES = res;
		
		if(!this.size)
			throw new Error('No size specified for number chunks');
		this.size = Math.round(this.size / PaintLayer.CHUNK_SIZE);

		this.map_size = this.size * PaintLayer.CHUNK_SIZE;
		
		let chunks_memory = 2 * (this.size * this.size * CHUNK_RES * CHUNK_RES * 4 / (1024*1024));
		console.log('map size:', this.map_size, 'number of chunks:', this.size*this.size,
			'\n\tmemory:', chunks_memory + 'MB');

		this.chunks = [];

		for(let y=0; y<this.size; y++) {
			for(let x=0; x<this.size; x++) {
				let mat = new Matrix2D();
				mat.setScale(PaintLayer.CHUNK_SIZE, PaintLayer.CHUNK_SIZE);

				xx = -(this.size-1) * PaintLayer.CHUNK_SIZE + x * PaintLayer.CHUNK_SIZE * 2;
				yy = (this.size-1) * PaintLayer.CHUNK_SIZE - y * PaintLayer.CHUNK_SIZE * 2;

				mat.setPos(xx, yy);

				let canvas: HTMLCanvasElement;
				if(_CLIENT_) {
					canvas = document.createElement('canvas');
					canvas.width = CHUNK_RES;
					canvas.height = CHUNK_RES;
				}
				else {
					//console.log(Canvas, _CLIENT_);
					canvas = Canvas.createCanvas(CHUNK_RES, CHUNK_RES);
				}

				let ctx = <CanvasRenderingContext2D>canvas.getContext('2d', 
					{antialias: true, alpha: true});
				if(!ctx)
					throw "Cannot get canvas context";
					
				if(!_CLIENT_) {
					//@ts-ignore
					ctx.antialias = 'none';
					ctx.filter = 'fast';
					//@ts-ignore
					ctx.patternQuality = 'fast';
				}
				ctx.lineCap = 'round';//butt, square

				this.chunks.push({
					matrix: mat,
					canvas: canvas,
					ctx: ctx,
					buff: null, //ctx.getImageData(0, 0, CHUNK_RES, CHUNK_RES)
					//new Uint8Array(CHUNK_RES * CHUNK_RES * 4),
					webgl_texture: null,//for WebGL rendering
					need_update: false
				});
			}
		}
	}

	get color() {
		return this._color;
	}

	set color(val) {
		this._color = val;
	}

	//receives start and end point coordinates
	drawLine(sx: number, sy: number, ex: number, ey: number, thickness: number, 
		prevent_chunks_update = false) 
	{
		thick_off = (thickness / this.map_size) / 2 * this.size;

		sxi = (sx / this.map_size + 1.0) / 2.0 * this.size;
		syi = (-sy / this.map_size + 1.0) / 2.0 * this.size;

		exi = (ex / this.map_size + 1.0) / 2.0 * this.size;
		eyi = (-ey / this.map_size + 1.0) / 2.0 * this.size;

		//fixing order
		if(exi < sxi) {
			temp = exi;
			exi = sxi;
			sxi = temp;
		}
		if(eyi < syi) {
			temp = eyi;
			eyi = syi;
			syi = temp;
		}

		sxi = clamp(sxi - thick_off, 0, this.size-1) | 0;
		syi = clamp(syi - thick_off, 0, this.size-1) | 0;

		exi = clamp(exi + thick_off, 0, this.size-1) | 0;
		eyi = clamp(eyi + thick_off, 0, this.size-1) | 0;

		thickness *= CHUNK_RES / PaintLayer.CHUNK_SIZE;

		for(itY = syi; itY <= eyi; itY++) {
			for(itX = sxi; itX <= exi; itX++) {
				ch_i = itY * this.size + itX;

				//calculating relative coords
				relXs = (sx + this.size * PaintLayer.CHUNK_SIZE - itX*PaintLayer.CHUNK_SIZE*2) / 
					(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;
				relYs = (-sy + this.size * PaintLayer.CHUNK_SIZE - itY*PaintLayer.CHUNK_SIZE*2) / 
					(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;

				relXe = (ex + this.size * PaintLayer.CHUNK_SIZE - itX*PaintLayer.CHUNK_SIZE*2) / 
					(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;
				relYe = (-ey + this.size * PaintLayer.CHUNK_SIZE - itY*PaintLayer.CHUNK_SIZE*2) / 
					(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;

				chunk_ctx = this.chunks[ch_i].ctx;
				if( !prevent_chunks_update )
					this.chunks[ch_i].need_update = true;

				chunk_ctx.globalCompositeOperation = this.composite;
				chunk_ctx.strokeStyle = this._color;
				chunk_ctx.lineWidth = thickness|0;

				chunk_ctx.beginPath();
					chunk_ctx.moveTo(relXs|0, relYs|0);
					chunk_ctx.lineTo(relXe|0, relYe|0);
				chunk_ctx.stroke();
			}
		}
	}

	drawCircle(sx: number, sy: number, radius: number, prevent_chunks_update = false) {
		radius /= 2;
		rad_off = (radius / this.map_size) * this.size;//NOTE - no / 2 here

		sxi_temp = (sx / this.map_size + 1.0) / 2.0 * this.size;
		syi_temp = (-sy / this.map_size + 1.0) / 2.0 * this.size;

		sxi = clamp(sxi_temp - rad_off, 0, this.size-1) | 0;
		syi = clamp(syi_temp - rad_off, 0, this.size-1) | 0;

		exi = clamp(sxi_temp + rad_off, 0, this.size-1) | 0;
		eyi = clamp(syi_temp + rad_off, 0, this.size-1) | 0;

		radius *= CHUNK_RES / PaintLayer.CHUNK_SIZE;

		for(itY = syi; itY <= eyi; itY++) {
			for(itX = sxi; itX <= exi; itX++) {
				ch_i = itY * this.size + itX;

				//calculating relative coords
				relXs = (sx + this.size * PaintLayer.CHUNK_SIZE - itX*PaintLayer.CHUNK_SIZE*2) / 
					(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;
				relYs = (-sy + this.size * PaintLayer.CHUNK_SIZE - itY*PaintLayer.CHUNK_SIZE*2) / 
					(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;
				
				chunk_ctx = this.chunks[ch_i].ctx;
				if( !prevent_chunks_update )
					this.chunks[ch_i].need_update = true;
				
				chunk_ctx.globalCompositeOperation = this.composite;

				chunk_ctx.beginPath();
					chunk_ctx.arc(relXs|0, relYs|0, radius|0, 0, PI_2, false);
					chunk_ctx.fillStyle = this._color;
				chunk_ctx.fill();
			}
		}
	}

	paintMapWalls(map: MapJSON_I) {//synchronous function
		//this.color = Colors.WALLS.hex;
		//if(map.data === null)
		//	throw "No map data found";
		let cc = map['walls_color'];
		this.walls_color = Colors.gen(cc[0], cc[1], cc[2]);
			
		let smooth = map['smooth_walls'];// || false;//image smoothing during scale

		let map_canvas: HTMLCanvasElement;
		if(_CLIENT_) {
			map_canvas = document.createElement('canvas');
			map_canvas.width = CHUNK_RES * this.size;//image.naturalWidth;
			map_canvas.height = CHUNK_RES * this.size;//image.naturalHeight;
		}
		else
			map_canvas = Canvas.createCanvas(CHUNK_RES * this.size, CHUNK_RES * this.size);

		let map_ctx = <CanvasRenderingContext2D>map_canvas.getContext('2d', 
			{antialias: true, alpha: true});
		if(!_CLIENT_) {
			//@ts-ignore
			map_ctx.antialias = 'false';
			//@ts-ignore
			map_ctx.patternQuality = 'fast';
		}
		//map_ctx.fillStyle = this.color;

		//@ts-ignore
		map_ctx['mozImageSmoothingEnabled'] = smooth;
		//@ts-ignore
		map_ctx['webkitImageSmoothingEnabled'] = smooth;
		//@ts-ignore
		map_ctx['msImageSmoothingEnabled'] = smooth;
		map_ctx['imageSmoothingEnabled'] = smooth;

		//console.log(isReady(), map['walls_texture']);
		map_ctx.drawImage(map['walls_texture'], 0, 0, map_canvas.width, map_canvas.height);

		let canvasData = map_ctx.getImageData(0, 0, map_canvas.width, map_canvas.height),
	     	pix = canvasData.data;

	    let cbuff = this.walls_color.byte_buffer;//Colors.WALLS.byte_buffer;
	    for(let i=0, n=pix.length; i<n; i+=4) {
	        pix[i+3] = pix[i];
	        pix[i] = cbuff[0];
	        pix[i+1] = cbuff[1];
	        pix[i+2] = cbuff[2];
	    }

	    map_ctx.putImageData(canvasData, 0, 0);

	    //TEST - saving loaded map as image (server side)
	    /*(function() {
	    	if(typeof module === 'undefined')
	    		return;
	    	//console.log(__dirname);
	    	var fs = require('fs'), 
	    		out = fs.createWriteStream('./preview.png'), 
	    		stream = map_canvas.pngStream();
			 
			stream.on('data', function(chunk){
			 	out.write(chunk);
			});
			 
			stream.on('end', function(){
			 	console.log('saved png');
			});
	    })();*/

		//drawing image on each chunk
		for(itY = 0; itY < this.size; itY++) {
			for(itX = 0; itX < this.size; itX++) {
				ch_i = itY * this.size + itX;
				chunk_ctx = this.chunks[ch_i].ctx;
				this.chunks[ch_i].need_update = true;

				// chunk_ctx['imageSmoothingEnabled'] = true;
				chunk_ctx.putImageData(canvasData, -CHUNK_RES*itX, -CHUNK_RES*itY, 
					CHUNK_RES*itX, CHUNK_RES*itY, CHUNK_RES, CHUNK_RES);
			}
		}

		if(typeof map_canvas.remove === 'function')
			map_canvas.remove();
	}

	//draw walls on edges so players cannot escape map area
	drawWalls(thickness: number, restrict?: number, prevent_chunks_update = false) {
		this.color = this.walls_color.hex;//Colors.WALLS.hex;
		this.walls_thickness = thickness;

		if(restrict === undefined)
			restrict = 0x0F;//binary -> 00001111

		//top
		if(restrict & (1 << 0))
			this.drawLine(-this.map_size, this.map_size - thickness, 
				this.map_size, this.map_size - thickness, thickness, prevent_chunks_update);
		//bottom
		if(restrict & (1 << 1))
			this.drawLine(-this.map_size, -this.map_size + thickness, 
				this.map_size, -this.map_size + thickness, thickness, prevent_chunks_update);
		//left
		if(restrict & (1 << 2))
			this.drawLine(-this.map_size + thickness, -this.map_size, 
				-this.map_size + thickness, this.map_size,  thickness, prevent_chunks_update);
		//right
		if(restrict & (1 << 3))
			this.drawLine(this.map_size - thickness, -this.map_size, 
				this.map_size - thickness, this.map_size,  thickness, prevent_chunks_update);

		//TEMP
		this.color = Colors.POISON.hex;
		//const rad = 0.1;

		/*var stains = [];
		for(let j=0; j<20; j++) {
			//var xxx = Math.random()*5;
			//var yyy = Math.random()*5;
			let stain = [];
			for(let i=0; i<6; i++) {
				var rx = (Math.random() - 0.5), ry = (Math.random() - 0.5), 
					rs = (Math.random()*0.5 + 0.5);
				rx = Math.floor(rx*100)/100;
				ry = Math.floor(ry*100)/100;
				rs = Math.floor(rs*100)/100;
				//this.drawCircle(xxx + rx*rad, yyy + ry*rad, 
				//	rs*rad);
				stain.push( [rx, ry, rs] );
			}
			stains.push(stain);
		}
		console.log( JSON.stringify(stains) );*/
	}

	drawSpawn(radius: number, thickness: number, prevent_chunks_update = false) {
		this.spawn_radius = radius;
		this.spawn_thickness = thickness;

		this.color = this.walls_color.hex;//Colors.WALLS.hex;
		this.drawCircle(0, 0, radius, prevent_chunks_update);

		//this.paintHole(0, 0, radius - thickness);
		this.color = Colors.WHITE.hex;
		this.composite = 'destination-out';
		//NOTE - cannot invoke this.paintHole due to recursion issue
		this.drawCircle(0, 0, radius - thickness, prevent_chunks_update);
		this.composite = 'source-over';//restore default

		this.color = Colors.SAFE_AREA.hex + 'A0';//semi transparent
		this.drawCircle(0, 0, radius - thickness, prevent_chunks_update);
	}

	paintHole(sx: number, sy: number, radius: number) {
		this.color = Colors.WHITE.hex;//"#ffff";

		this.composite = 'destination-out';
		this.drawCircle(sx, sy, radius, false);
		this.composite = 'source-over';//restore default

		//repainting indestructible walls, spawn area etc
		let bytes = 0x00;

		//console.log(sx, sy, radius, this.map_size, this.walls_thickness);
		if(sy + radius > this.map_size - this.walls_thickness*2.0)
			bytes |= 1 << 0;
		else if(sy - radius < -this.map_size + this.walls_thickness*2.0)
			bytes |= 1 << 1;

		if(sx + radius > this.map_size - this.walls_thickness*2.0)
			bytes |= 1 << 3;
		else if(sx - radius < -this.map_size + this.walls_thickness*2.0)
			bytes |= 1 << 2;

		if(bytes !== 0)
			this.drawWalls(this.walls_thickness, bytes, true);

		//checking spawn
		if( pow2(sx) + pow2(sy) <= pow2(this.spawn_radius + this.spawn_thickness + radius) ) {
			if(this.spawn_radius && this.spawn_thickness)
				this.drawSpawn(this.spawn_radius, this.spawn_thickness, true);
		}
	}

	//@x, y - pixel coordinates, @out_buff - Uint8Array buffer for color data
	getPixelColor(x: number, y: number, out_buff: Uint8Array) {
		sxi = ((x / this.map_size + 1.0) / 2.0 * this.size) | 0;
		syi = ((-y / this.map_size + 1.0) / 2.0 * this.size) | 0;
		ch_i = syi * this.size + sxi;
		
		//safety for incorrect coords issues
		if(this.chunks[ch_i]/* && this.chunks[ch_i].buff != null*/) {
			relXs = (x + this.size * PaintLayer.CHUNK_SIZE - sxi*PaintLayer.CHUNK_SIZE*2) / 
				(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;
			relYs = (-y + this.size * PaintLayer.CHUNK_SIZE - syi*PaintLayer.CHUNK_SIZE*2) / 
				(PaintLayer.CHUNK_SIZE*2.0) * CHUNK_RES;
			
			pixel_i = ((relXs|0) + (relYs|0) * CHUNK_RES) * 4;

			for(ii=0; ii<4; ii++) {
				out_buff[ii] = this.chunks[ch_i].buff.data[pixel_i + ii];
			}
		}
	}
}
