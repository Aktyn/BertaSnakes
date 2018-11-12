///<reference path="entities.ts"/>
///<reference path="../engine/graphics.ts"/>

namespace Entities {
	var ii: number, entity_it: Entities.EntityObjectSchema, obj_it: Object2D,
		xx: number, yy: number, sw: number, sh: number;

	export class CanvasEntities extends Entities.EntitiesBase {

		constructor() {
			super();
		}

		destroy() {
			super.destroy();
		}

		generateTexture(data: Entities.EntitySchema) {
			return ASSETS.getTexture( data.texture_name );
		}

		draw(tCanvas: GRAPHICS.CanvasExtended, offsetX: number, offsetY: number, scaler: number) {
			//tCanvas.drawRect(50, 50, 100, 100);
			var instance = Renderer.RendererBase.getCurrentInstance();

			for(ii=0; ii<this.entities.length; ii++) {
				entity_it = this.entities[ii];

				//entity_it.color <-- TODO - tint images

				for(obj_it of entity_it.objects) {//drawing objects
					xx = offsetX + obj_it.x * scaler;
					yy = offsetY - obj_it.y * scaler;

					sw = obj_it.width * scaler;
					sh = obj_it.height * scaler;

					//if inside screen
					if(instance.withinVisibleArea(obj_it.x, obj_it.y, obj_it.width)) {
						tCanvas.drawImageCentered(
							<HTMLImageElement | HTMLCanvasElement>entity_it.texture, 
							xx, yy, sw, sh, obj_it.rot, true);
					}
				}
			}
		}
	}
}