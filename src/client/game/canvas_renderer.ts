///<reference path="renderer.ts"/>
///<reference path="canvas_entities.ts"/>

namespace Renderer {
	var windowWidth = $$.getScreenSize().width, windowHeight = $$.getScreenSize().height;

	function onResize(e: Event) {
		//@ts-ignore
		windowWidth = (e.srcElement || e.currentTarget).innerWidth;
		//@ts-ignore
		windowHeight = (e.srcElement || e.currentTarget).innerHeight;
	}

	export class Canvas extends Renderer.RendererBase {
		private ready = false;

		private entities: Entities.CanvasEntities;

		private foreground: GRAPHICS.CanvasExtended;
		private background: GRAPHICS.CanvasExtended;

		private background_texture: {image: HTMLImageElement, smooth: boolean};

		private map_container: $_face;

		private res_px = 0;
		private transform = {x: 0, y: 0};

		constructor(map: GameMap.Map, map_data: MapJSON_I) {
			super(map);

			this.entities = new Entities.CanvasEntities();

			this.foreground = new GRAPHICS.CanvasExtended();

			this.map_container = $$.create('DIV').addClass('canvas_rederer_walls').setStyle({
				'position': 'fixed',
				'left': '0px',
				'top': '0px',
				'margin': 'auto',
				'transform': `translate(${this.transform.x}px, ${this.transform.y}px)`,
				'display': 'grid',
			});

			$$(document.body).appendAtBeginning(this.map_container);

			this.background = new GRAPHICS.CanvasExtended();
			this.background_texture = {
				image: map_data['background_texture'], 
				smooth: map_data['smooth_background']
			};

			$$(window).on('resize', onResize);
			$$(this.foreground.canvas).on('wheel', (e) => this.zoom((<WheelEvent>e).wheelDelta / 120));
		}

		destroy() {
			super.destroy();
			this.entities.destroy();
			this.foreground.destroy();
			this.background.destroy();

			$$(window).off('resize', onResize);
		}

		getAspect() {
			return this.foreground.aspect;//window aspect
		}

		getHeight() {
			return windowHeight;
		}

		onMapLoaded(map: GameMap.Map) {
			let ww = Math.sqrt(map.chunks.length)|0;
			this.res_px = PaintLayer.Layer.CHUNK_RES * ww;
			//Math.floor(windowHeight * PaintLayer.Layer.CHUNK_SIZE * ww);
			this.transform.x = -(this.res_px - windowWidth) / 2;
			this.transform.y = -(this.res_px - windowHeight) / 2;
			
			this.map_container.setStyle({
				'width': (this.res_px) + 'px',
				'height': (this.res_px) + 'px',
				'transform': `translate(${this.transform.x|0}px, ${this.transform.y|0}px)`,
				'grid-template-columns': `repeat(${ww}, ${PaintLayer.Layer.CHUNK_RES}px)`,
				'grid-template-rows': `repeat(${ww}, ${PaintLayer.Layer.CHUNK_RES}px)`
			});
			this.background.setResolution(this.res_px, this.res_px);
			this.background.canvas.style.transform = 
				`translate(${this.transform.x|0}px, ${this.transform.y|0}px)`;
			this.background.drawImageFull(this.background_texture.image, 
				this.background_texture.smooth);

			for(var ch of map.chunks) {
				ch.canvas.style['transform'] = 
					`scale(${(PaintLayer.Layer.CHUNK_RES+2) / PaintLayer.Layer.CHUNK_RES})`;
				ch.canvas.style.width = (PaintLayer.Layer.CHUNK_RES-1) + 'px';
				ch.canvas.style.height = (PaintLayer.Layer.CHUNK_RES-1) + 'px';
				
				this.map_container.addChild( ch.canvas );
			}

			this.ready = true;
		}

		draw(delta: number) {
			if(!this.ready)
				return;

			super.draw(delta);
			
			var add_sc = windowHeight / (PaintLayer.Layer.CHUNK_RES / PaintLayer.Layer.CHUNK_SIZE);
			
			this.transform.x = -(this.res_px - windowWidth) / 2 - 
				(this.camera.x * this.camera.z) * windowHeight/2;
			this.transform.y = -(this.res_px - windowHeight) / 2 +
				(this.camera.y * this.camera.z) * windowHeight/2;

			var transform = `translate(${this.transform.x|0}px, ${this.transform.y|0}px)
				scale(${this.camera.z*add_sc})`;
			this.map_container.style.transform = this.background.canvas.style.transform = transform;

			this.foreground.clearAll();
			this.entities.draw(this.foreground, 
				windowWidth/2 - (this.camera.x * this.camera.z) * windowHeight/2, 
				(this.camera.y * this.camera.z + 1) * windowHeight/2, 
				windowHeight/2 * this.camera.z);
			//this.foreground.drawRect(0, 0, 400, 400);
		}
	}
}