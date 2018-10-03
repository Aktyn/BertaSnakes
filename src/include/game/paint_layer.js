const PaintLayer = (function(Matrix2D, Colors, Canvas) {
	//CHUNK_RES / CHUNK_SIZE should be 1024 at highest settings
	var CHUNK_RES = 128;//resolution of single chunk (256)
	const CHUNK_SIZE = 0.25;//size of a single chunk compared to screen height

	if(typeof module === 'undefined') {//client-side only
		var applyResolution = function() {
			if(typeof SETTINGS === 'undefined')
				throw new Error('Client-side SETTINGS module required');
			switch(SETTINGS.painter_resolution) {
				case 'LOW':
					CHUNK_RES = 64;
					break;
				case 'MEDIUM':
					CHUNK_RES = 128;
					break;
				case 'HIGH':
					CHUNK_RES = 256;
					break;
			}
		};

		setTimeout(applyResolution, 1);
	}

	const PI_2 = Math.PI * 2.0;

	//performance mater variables
	var sxi_temp, syi_temp, sxi, syi, exi, eyi, xx, yy, temp, itY, itX, ch_i, chunk_ctx, 
		relXs, relYs, relXe, relYe,
		thick_off, rad_off, pixel_i, ii;

	var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
	const pow2 = a => a*a;

	return class {
		constructor() {
			this._color = '#fff';
			this.composite = 'source-over';
			this.chunks = [];

			//this.size
			this.map_size = 1;//default
			this.walls_thickness = 0;
			//this.spawn_radius = 0.5;
			//this.spawn_thickness = 0.08;
		}

		destroy() {
			this.chunks.forEach(ch => {
				if(ch.webgl_texture != null)
					ch.webgl_texture.destroy();
				delete ch.canvas;
				delete ch.buff;
			});
			this.chunks = null;
		}

		static get CHUNK_RES() {
			return CHUNK_RES;
		}
		static get CHUNK_SIZE() {
			return CHUNK_SIZE;
		}

		generateChunks() {
			if(!this.size)
				throw new Error('No size specified for number chunks');
			this.size = Math.round(this.size / CHUNK_SIZE);

			this.map_size = this.size * CHUNK_SIZE;
			console.log('map size:', this.map_size, 'number of chunks:', this.size*this.size);
			let chunks_memory = 2 * (this.size * this.size * CHUNK_RES * CHUNK_RES * 4 / (1024*1024));
			console.log('\tmemory:', chunks_memory + 'MB');

			this.chunks = [];

			for(let y=0; y<this.size; y++) {
				for(let x=0; x<this.size; x++) {
					let mat = new Matrix2D();
					mat.setScale(CHUNK_SIZE, CHUNK_SIZE);

					xx = -(this.size-1) * CHUNK_SIZE + x * CHUNK_SIZE * 2;
					yy = (this.size-1) * CHUNK_SIZE - y * CHUNK_SIZE * 2;

					mat.setPos(xx, yy);

					let canvas;
					if(typeof module === 'undefined') {
						canvas = document.createElement('CANVAS');
						canvas.width = CHUNK_RES;
						canvas.height = CHUNK_RES;
					}
					else {
						canvas = new Canvas(CHUNK_RES, CHUNK_RES);
					}

					let ctx = canvas.getContext('2d', {antialias: true, alpha: true});
					if(typeof module !== 'undefined') {
						ctx.antialias = 'none';
						ctx.filter = 'fast';
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

		drawLine(sx, sy, ex, ey, thickness, prevent_chunks_update = false) {//start and end point
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

			thickness *= CHUNK_RES / CHUNK_SIZE;

			for(itY = syi; itY <= eyi; itY++) {
				for(itX = sxi; itX <= exi; itX++) {
					ch_i = itY * this.size + itX;

					//calculating relative coords
					relXs = (sx + this.size * CHUNK_SIZE - itX*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) * 
						CHUNK_RES;
					relYs = (-sy + this.size * CHUNK_SIZE - itY*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) * 
						CHUNK_RES;

					relXe = (ex + this.size * CHUNK_SIZE - itX*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) *
						CHUNK_RES;
					relYe = (-ey + this.size * CHUNK_SIZE - itY*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) *
						CHUNK_RES;

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

		drawCircle(sx, sy, radius, prevent_chunks_update = false) {
			radius /= 2;
			rad_off = (radius / this.map_size) * this.size;//NOTE - no / 2 here

			sxi_temp = (sx / this.map_size + 1.0) / 2.0 * this.size;
			syi_temp = (-sy / this.map_size + 1.0) / 2.0 * this.size;

			sxi = clamp(sxi_temp - rad_off, 0, this.size-1) | 0;
			syi = clamp(syi_temp - rad_off, 0, this.size-1) | 0;

			exi = clamp(sxi_temp + rad_off, 0, this.size-1) | 0;
			eyi = clamp(syi_temp + rad_off, 0, this.size-1) | 0;

			radius *= CHUNK_RES / CHUNK_SIZE;

			for(itY = syi; itY <= eyi; itY++) {
				for(itX = sxi; itX <= exi; itX++) {
					ch_i = itY * this.size + itX;

					//calculating relative coords
					relXs = (sx + this.size * CHUNK_SIZE - itX*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) * 
						CHUNK_RES;
					relYs = (-sy + this.size * CHUNK_SIZE - itY*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) * 
						CHUNK_RES;
					
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

		paintMapWalls(map) {//synchronous function
			//this.color = Colors.WALLS.hex;
			var smooth = map.data['smooth_texture'] || false;//image smoothing during scale

			let map_canvas;
			if(typeof module === 'undefined') {
				map_canvas = document.createElement('CANVAS');
				map_canvas.width = CHUNK_RES * this.size;//image.naturalWidth;
				map_canvas.height = CHUNK_RES * this.size;//image.naturalHeight;
			}
			else
				map_canvas = new Canvas(CHUNK_RES * this.size, CHUNK_RES * this.size);

			let map_ctx = map_canvas.getContext('2d', {antialias: true, alpha: true});
			if(typeof module !== 'undefined') {
				map_ctx.antialias = 'false';
				map_ctx.patternQuality = 'fast';
			}
			//map_ctx.fillStyle = this.color;

			
			map_ctx['mozImageSmoothingEnabled'] = smooth;
			map_ctx['webkitImageSmoothingEnabled'] = smooth;
			map_ctx['msImageSmoothingEnabled'] = smooth;
			map_ctx['imageSmoothingEnabled'] = smooth;
			map_ctx.drawImage(map.image, 0, 0, map_canvas.width, map_canvas.height);

			var canvasData = map_ctx.getImageData(0, 0, map_canvas.width, map_canvas.height),
		     	pix = canvasData.data;

		    var cbuff = Colors.WALLS.byte_buffer;
		    for(var i=0, n=pix.length; i<n; i+=4) {
		        pix[i+3] = pix[i];
		        pix[i+0] = cbuff[0];
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
		drawWalls(thickness, restrict, prevent_chunks_update = false) {
			this.color = Colors.WALLS.hex;
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
			const rad = 0.1;

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

		drawSpawn(radius, thickness, prevent_chunks_update = false) {
			this.spawn_radius = radius;
			this.spawn_thickness = thickness;

			this.color = Colors.WALLS.hex;
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

		paintHole(sx, sy, radius) {
			this.color = Colors.WHITE.hex;//"#ffff";

			this.composite = 'destination-out';
			this.drawCircle(sx, sy, radius, false);
			this.composite = 'source-over';//restore default

			//repainting undestructable walls, spawn area etc
			var bytes = 0x00;

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
		getPixelColor(x, y, out_buff) {
			sxi = ((x / this.map_size + 1.0) / 2.0 * this.size) | 0;
			syi = ((-y / this.map_size + 1.0) / 2.0 * this.size) | 0;
			ch_i = syi * this.size + sxi;
			
			//safety for incorrect coords issues
			if(this.chunks[ch_i]/* && this.chunks[ch_i].buff != null*/) {
				relXs = (x + this.size * CHUNK_SIZE - sxi*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) * 
					CHUNK_RES;
				relYs = (-y + this.size * CHUNK_SIZE - syi*CHUNK_SIZE*2) / (CHUNK_SIZE*2.0) * 
					CHUNK_RES;
				
				pixel_i = ((relXs|0) + (relYs|0) * CHUNK_RES) * 4;

				for(ii=0; ii<4; ii++) {
					out_buff[ii] = this.chunks[ch_i].buff.data[pixel_i + ii];
				}
			}
		}
	};
})(
	typeof Matrix2D !== 'undefined' ? Matrix2D : require('./../utils/matrix2d.js'),
	typeof Colors !== 'undefined' ? Colors : require('./../game/common/colors.js'),
	typeof module === 'undefined' ? undefined : require('canvas')
);

try {//export for NodeJS
	module.exports = PaintLayer;
}
catch(e) {}
