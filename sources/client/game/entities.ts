import Colors from '../../common/game/common/colors';
import Emoticon, {EMOTS} from '../../common/game/objects/emoticon';
import Shield from '../../common/game/objects/shield';
import Bomb from '../../common/game/objects/bomb';
import Bullet from '../../common/game/objects/bullet';
import Object2D from '../../common/game/objects/object2d';
import {ExtendedTexture} from './engine/graphics';

import Player, {PLAYER_TYPES} from '../../common/game/objects/player';

export const enum LAYERS {
	FOREGROUND = 0,
	PAINT
};

const DEFAULT_LAYER = LAYERS.FOREGROUND;
const DEFAULT_COLOR = Colors.WHITE.buffer;

var ids = 0, key: string, l: number, entity_it: EntityObjectSchema;

export interface EntitySchema {
	id?: number;
	texture_name: string;
	color?: Float32Array;
	layer?: number;
	linear?: boolean;
}

export interface EntityObjectSchema {
	layer: number;
	color: Float32Array;
	texture: ExtendedTexture | HTMLCanvasElement | HTMLImageElement;
	objects: Object2D[];
}

function extendType<T>(target: T): T & {[index: string]: EntitySchema} {
	return target as T & {[index: string]: EntitySchema};
}

//definies texture colors etc of each individual game entity
//TODO - this data can be loaded from JSON file
var entitiesData = extendType({
	'HEALTH_ITEM': {
		texture_name: 'health_item'//name of texture resource
	},
	'ENERGY_ITEM': {
		texture_name: 'energy_item'
	},
	'SPEED_ITEM': {
		texture_name: 'speed_item'
	},
	'ENEMY_ROCKET': {
		texture_name: 'enemy_rocket',
	},
	'ENEMY_POISONOUS': {
		texture_name: 'enemy_poisonous'
	},
	'ENEMY_SPAWNER': {
		texture_name: 'ring_thick',
		color: Colors.ENEMY_SPAWN.buffer,
		layer: LAYERS.PAINT
	},
	'POISONOUS_ENEMY_SPAWNER': {
		texture_name: 'ring_thick',
		color: Colors.POISON.buffer,
		layer: LAYERS.PAINT
	},
	'HEALTH_BAR': {
		texture_name: 'pixel',
		linear: false,
		color: Colors.HEALTH_BAR.buffer
	},
	'STREAK': {
		texture_name: 'streak'
	},
	'IMMUNITY_AUREOLE': {
		texture_name: 'ring',
		color: Colors.IMMUNITY_AUREOLE.buffer,
		layer: LAYERS.PAINT
	}
});

let prepared = false;
export function prepareEntities() {
	if(prepared)
		return;
	prepared = true;

	//EMOTICONS ENTITIES
	EMOTS.forEach(emot => {
		let emot_name = Emoticon.entityName(emot.file_name);
		entitiesData[emot_name] = {
			texture_name: emot_name,
			linear: true
		};
	});

	//adding entities that are distinct by player's colors
	Colors.PLAYERS_COLORS.forEach((color) => {//for each player color
		let bullet_name = Bullet.entityName(color);
		entitiesData[bullet_name] = {
			texture_name: 'bullet',
			color: color.buffer
		};

		let bomb_name = Bomb.entityName(color);
		entitiesData[bomb_name] = {
			texture_name: 'bomb',
			color: color.buffer,
			layer: LAYERS.PAINT
		};

		let shield_name = Shield.entityName(color);
		entitiesData[shield_name] = {
			texture_name: 'ring_thick',
			color: color.buffer,
			layer: LAYERS.PAINT
		};

		//for each player type
		//@ts-ignore
		Object.keys(PLAYER_TYPES).map(key => PLAYER_TYPES[key])
			.filter(type_i => typeof type_i === 'number').forEach(type_i => {
				let name = Player.entityName(type_i, color);
				//console.log(name);
				entitiesData[ name ] = {
					texture_name: name,
					linear: true,
					color: Colors.WHITE.buffer,
					layer: LAYERS.PAINT
				};
			});
	});

	for(key in entitiesData)//assigning id to each entity data
		entitiesData[key].id = ids++;
}

var current_instance: EntitiesBase | null = null;

export default abstract class EntitiesBase {
	public entities: EntityObjectSchema[];

	constructor() {
		if(current_instance === null)
			current_instance = this;
		else
			throw new Error('Only single instance of Entities class is allowed');

		//creating list of entities
		this.entities = [];

		var data: EntitySchema;
		for(key in entitiesData) {
			data = entitiesData[key];

			//CREATE NEW ENTITY OBJECT
			this.entities.push({
				layer: data.layer !== undefined ? data.layer : DEFAULT_LAYER,
				color: data.color || DEFAULT_COLOR,
				
				texture: this.generateTexture(data),
				objects: []
			});
		}
	}

	destroy() {
		console.log('removing existing entities');
		this.entities.forEach(ent => {
			//@ts-ignore
			ent.objects = null;
		});
		//@ts-ignore
		this.entities = null;

		current_instance = null;
	}

	public static getEntity(name: string) {
		return entitiesData[name];
	}
	public static getEntityId(name: string) {
		if(name in entitiesData)
			return entitiesData[name].id;
		return null;
	}

	protected abstract generateTexture(texture_name: EntitySchema): 
		ExtendedTexture | HTMLCanvasElement | HTMLImageElement;

	//@entity_id - id of entity (or null for server cases)
	//@object - instance of Object2D
	public static addObject(entity_id: number | null, object: Object2D) {
		//console.log(entity_id, object);
		if(entity_id === null || current_instance == null)
			return false;
		if(current_instance.entities[entity_id]) {
			current_instance.entities[entity_id].objects.push( object );
			return true;
		}

		return false;
	}

	public static removeObject(entity_id: number, object: Object2D) {
		if(current_instance == null)
			return false;

		if(current_instance.entities[entity_id]) {
			l = current_instance.entities[entity_id].objects.indexOf( object );
			if(l !== -1) {
				current_instance.entities[entity_id].objects.splice(l, 1);
				return true;
			}
		}
		else {//searching for object in every entity (slow)
			for(entity_it of current_instance.entities) {
				l = entity_it.objects.indexOf( object );
				if(l !== -1) {
					entity_it.objects.splice(l, 1);
					return true;
				}
			}
		}

		return false;
	}
}