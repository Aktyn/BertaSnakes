///<reference path="entities.ts"/>
///<reference path="../engine/graphics.ts"/>

namespace Entities {
	if(typeof GRAPHICS === 'undefined')
		throw "GRAPHICS module must be loaded before Renderer.WebGL";
	var Graphics = GRAPHICS;

	const DEFAULT_FILTERING = true;

	var ii: number, obj_it: Object2D, entity_it: EntityObjectSchema;

	export class WebGLEntities extends Entities.EntitiesBase {
		private rect?: GRAPHICS.VBO_I;
		
		constructor(rect: GRAPHICS.VBO_I) {
			$$.assert(Graphics.isInitialized(), 'Graphics must be initialized');

			super();

			this.rect = rect;//VBO rect
		}

		destroy() {
			this.entities.forEach(ent => {
				//@ts-ignore
				ent.texture.destroy();
			});
			

			super.destroy();//NOTE - this destroy must be invoked after destroing entities textures
		}

		generateTexture(data: EntitySchema) {
			return Graphics.TEXTURES.createFrom(
				ASSETS.getTexture( data.texture_name ), 
				data.linear === undefined ? DEFAULT_FILTERING : data.linear 
			);
		}

		drawLayer(layer: number) {
			for(ii=0; ii<this.entities.length; ii++) {
				entity_it = this.entities[ii];
				if(entity_it.layer !== layer || entity_it.objects.length === 0)
					continue;

				Graphics.SHADERS.uniform_vec4('color', entity_it.color);
				//@ts-ignore
				entity_it.texture.bind();

				for(obj_it of entity_it.objects) {//drawing objects
					Graphics.SHADERS.uniform_mat3('u_matrix', <Float32Array>obj_it.buffer);
					//@ts-ignore
					this.rect.draw();//works only in WebGL
				}
			}
		}
	}
}//)();