///<reference path="../../include/game/objects/player.ts"/>
///<reference path="../../include/game/common/colors.ts"/>
///<reference path="../../include/game/objects/emoticon.ts"/>
///<reference path="../../include/game/objects/shield.ts"/>
///<reference path="../../include/game/objects/bomb.ts"/>
///<reference path="../../include/game/objects/bullet.ts"/>
///<reference path="../../include/game/objects/object2d.ts"/>

///<reference path="../engine/graphics.ts"/>
///<reference path="in_game_gui.ts"/>

//const Entities = (function() {//@child of Renderer

// namespace EntitiesScope {
var Entities = (function() {
	var current_instance: Entities | null = null;

	const LAYERS = {
		FOREGROUND: 0,
		PAINT: 1
	};

	const DEFAULT_LAYER = LAYERS.FOREGROUND;
	const DEFAULT_COLOR = Colors.WHITE.buffer;
	const DEFAULT_FILTERING = true;

	interface EntitySchema {
		id?: number;
		texture_name: string;
		color?: Float32Array;
		layer?: number;
		linear?: boolean;
	}

	interface EntityObjectSchema {
		layer: number;
		color: Float32Array;
		texture: GRAPHICS.ExtendedTexture;//TODO <-- type
		objects: Object2D[];
	}

	//definies texture colors etc of each individual game entity
	//NOTE - entry names must be prevented from change by closure compiller
	//TODO - this data can be loaded from JSON file
	const EntitiesData: {[index:string]: EntitySchema} = {
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
	};

	//EMOTICONS ENTITIES
	InGameGUI.EMOTS.forEach(emot => {
		let emot_name = Emoticon.entityName(emot.file_name);
		EntitiesData[emot_name] = {
			texture_name: emot_name,
			linear: true
		};
	});

	//adding entities that are distinct by player's colors
	Colors.PLAYERS_COLORS.forEach((color) => {//for each player color
		let bullet_name = Bullet.entityName(color);
		EntitiesData[bullet_name] = {
			texture_name: 'bullet',
			color: color.buffer
		};

		let bomb_name = Bomb.entityName(color);
		EntitiesData[bomb_name] = {
			texture_name: 'bomb',
			color: color.buffer,
			layer: LAYERS.PAINT
		};

		let shield_name = Shield.entityName(color);
		EntitiesData[shield_name] = {
			texture_name: 'ring_thick',
			color: color.buffer,
			layer: LAYERS.PAINT
		};

		//for each player type
		//@ts-ignore
		Object.keys(Player.TYPES).map(key => Player.TYPES[key]).forEach(type_i => {
			let name = Player.entityName(type_i, color);
			//console.log(name);
			EntitiesData[ name ] = {
				texture_name: name,
				linear: true,
				color: Colors.WHITE.buffer,
				layer: LAYERS.PAINT
			};
		});
	});
	
	var ids = 0, key, l, entity_it, ii, obj_it;//data

	for(key in EntitiesData)//assigning id to each entity data
		EntitiesData[key].id = ids++;

	// console.log(EntitiesData)

	class Entities {
		private rect: any;//TODO - assign type
		private entities: EntityObjectSchema[];

		constructor(rect: any) {
			$$.assert(GRAPHICS.isInitialized(), 'Graphics must be initialized');

			if(current_instance === null)
				current_instance = this;
			else
				throw new Error('Only single instance of Entities class is allowed');

			this.rect = rect;//VBO rect

			//creating list of entities
			this.entities = [];

			var data: EntitySchema;
			for(key in EntitiesData) {
				data = EntitiesData[key];

				//CREATE NEW ENTITY OBJECT
				this.entities.push({
					layer: data.layer !== undefined ? data.layer : DEFAULT_LAYER,
					color: data.color || DEFAULT_COLOR,
					
					texture: GRAPHICS.TEXTURES.createFrom(
						ASSETS.getTexture( data.texture_name ), 
						data.linear === undefined ? DEFAULT_FILTERING : data.linear 
					),
					objects: []
				});
			}
		}

		destroy() {
			console.log('removing existing entities');

			this.entities.forEach(ent => {
				ent.texture.destroy();
				//@ts-ignore
				ent.objects = null;
			});
			//@ts-ignore
			this.entities = null;

			current_instance = null;
		}

		drawLayer(layer: number) {
			// for(entity_it of this.entities) {
			for(ii=0; ii<this.entities.length; ii++) {
				entity_it = this.entities[ii];
				if(entity_it.layer !== layer || entity_it.objects.length === 0)
					continue;

				//@ts-ignore
				GRAPHICS.SHADERS.uniform_vec4('color', entity_it.color);
				entity_it.texture.bind();

				for(obj_it of entity_it.objects) {//drawing objects
					//@ts-ignore
					GRAPHICS.SHADERS.uniform_mat3('u_matrix', <Float32Array>obj_it.buffer);
					this.rect.draw();
				}
			}
		}

		////////////////////////////////////////////////////////////
		// STATIC METHODS
		////////////////////////////////////////////////////////////

		//@entity_id - id of entity (or null for server cases)
		//@object - instance of Object2D
		static addObject(entity_id: number | null, object: Object2D) {
			//console.log(entity_id, object);
			if(entity_id === null || current_instance == null)
				return false;
			if(current_instance.entities[entity_id]) {
				current_instance.entities[entity_id].objects.push( object );
				return true;
			}

			return false;
		}

		static removeObject(entity_id: number, object: Object2D) {
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

		public static LAYERS = LAYERS;
	}

	//@ts-ignore
	Object.assign(Entities, EntitiesData);
	//self.LAYERS = LAYERS;

	return Entities;
})();

// var Entities = EntitiesScope.Entities;