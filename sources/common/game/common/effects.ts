import Object2D from '../objects/object2d';
import Movement from './movement';

interface ActiveEffect {
	id: number;
	duration: number;
	timer: number;
}

interface EffectSchema {
	id: number; 
	duration: number;
}

interface InteractiveObject extends Object2D {
	movement: Movement;
}

const SPEED_VALUE = 1.0;//should match DEFAULT_SPEED from bullet.js 

const EFFECTS_SCHEMA: {[index:string]: EffectSchema} = {//SCHEMA
	SPAWN_IMMUNITY: <EffectSchema>{ duration: 3 },
	SHIELD: <EffectSchema>{ 
		//id: 0,
		duration: 8//seconds
	},
	SPEED: <EffectSchema>{ duration: 2 },
	POISONING: <EffectSchema>{ duration: 0.5 }
};

var e_i = 0;

for(var eff in EFFECTS_SCHEMA) {
	//@ts-ignore
	EFFECTS_SCHEMA[eff].id = e_i++;
}

export default class Effects {
	public static TYPES = EFFECTS_SCHEMA;

	private owner: InteractiveObject;
	private a_effects: ActiveEffect[] = [];

	constructor(owner: Object2D) {//@owner - Object2D that owns Effects instance
		this.owner = <InteractiveObject>owner;
		//this.a_effects = [];//active effects
	}

	clearAll() {//clears all effects
		this.a_effects = [];
	}

	active(effect: EffectSchema) {
		this.onEffectStart(effect);

		//renew effect duration if one is already active
		for(e_i=0; e_i<this.a_effects.length; e_i++) {
			if(this.a_effects[e_i].id === effect.id) {
				this.a_effects[e_i].timer = 0;
				return;
			}
		}

		this.a_effects.push({
			id: effect.id,//EFFECTS_SCHEMA reference
			duration: effect.duration || 0,
			timer: 0
		});
	}

	isActive(effect: EffectSchema) {
		for(e_i=0; e_i<this.a_effects.length; e_i++) {
			if(this.a_effects[e_i].id === effect.id)
				return true;
		}
		return false;
	}

	onEffectStart(effect: EffectSchema) {
		switch(effect) {
			default: break;
			case EFFECTS_SCHEMA.SPEED:
				if(this.owner.movement !== undefined) {//affect object's movement
					this.owner.movement.set(Movement.FLAGS.LOCKED_SPEED, true);
					this.owner.movement.speed = SPEED_VALUE;
				}
				break;
		}
	}

	onEffectEnd(effect_id: number) {
		switch(effect_id) {
			default: break;
			case EFFECTS_SCHEMA.SPEED.id:
				if(this.owner.movement !== undefined) {//affect object's movement
					this.owner.movement.speed = this.owner.movement.maxSpeed;
					this.owner.movement.set(Movement.FLAGS.LOCKED_SPEED, false);
				}
				break;
		}
	}

	update(delta: number) {
		for(e_i=0; e_i<this.a_effects.length; e_i++) {
			if((this.a_effects[e_i].timer+=delta) >= this.a_effects[e_i].duration === true) {
				this.onEffectEnd( this.a_effects[e_i].id );
				this.a_effects.splice(e_i, 1);
				e_i--;
			}
		}
		//console.log(this.a_effects.length);
	}
}