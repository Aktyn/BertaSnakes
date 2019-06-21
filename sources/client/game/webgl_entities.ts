import EntitiesBase, {EntityObjectSchema, EntitySchema} from './entities';
import Object2D from '../../common/game/objects/object2d';
import {VBO_I, isInitialized, TEXTURES, SHADERS} from './engine/graphics';
import Assets from './engine/assets';

const LINEAR_AS_DEFAULT_FILTERING = true;

var ii: number, obj_it: Object2D, entity_it: EntityObjectSchema;

export default class WebGLEntities extends EntitiesBase {
	private rect: VBO_I;
	
	constructor(_rect: VBO_I) {
		if( !isInitialized() )
			throw new Error('Graphics must be initialized');

		super();

		this.rect = _rect;//VBO rectangle
	}

	destroy() {
		this.entities.forEach(ent => {
			//@ts-ignore
			ent.texture.destroy();
		});
		
		super.destroy();//NOTE - this destroy must be invoked after destroying entities textures
	}

	generateTexture(data: EntitySchema) {
		return TEXTURES.createFrom(
			Assets.getTexture( data.texture_name ), 
			data.linear === undefined ? LINEAR_AS_DEFAULT_FILTERING : data.linear 
		);
	}

	drawLayer(layer: number) {
		for(ii=0; ii<this.entities.length; ii++) {
			entity_it = this.entities[ii];
			if(entity_it.layer !== layer || entity_it.objects.length === 0)
				continue;

			SHADERS.uniform_vec4('color', entity_it.color);
			//@ts-ignore
			entity_it.texture.bind();

			for(obj_it of entity_it.objects) {//drawing objects
				SHADERS.uniform_mat3('u_matrix', <Float32Array>obj_it.buffer);
				this.rect.draw();//works only in WebGL
			}
		}
	}
}