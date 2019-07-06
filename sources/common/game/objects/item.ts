import Object2D from './object2d';

declare var _CLIENT_: boolean;
if(_CLIENT_)
	{ // noinspection ES6ConvertVarToLetConst
		var EntitiesBase = require('../../../client/game/entities').default;
	}

export const enum ITEM_TYPES {//enum
	HEALTH = 0,
	SPEED,
	ENERGY
}
//NOTE: sum of this array must be equal to 1 and it must be sorted with ascending order
const PROBABILITIES = [0.1, 0.2, 0.7];

const SCALE = 0.075;

//lifetime in seconds
const SPAWN_DURATION = 1, LIFETIME = 15, BLINKING_TIME = 2.5, SHRINKING_SPEED = 0.2;

let sc = 0;

export default class Item extends Object2D {
	public type: ITEM_TYPES;

	private blink_percent = 0;
	private timer = 0;

	private readonly entity_name?: string;

	constructor(_type: ITEM_TYPES) {
		super();
		super.setScale(0, 0);

		this.type = _type;
		
		// this.blink_percent = 0;
		// this.timer = 0;

		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined') {
			this.entity_name = Item.entityName(_type);//client-side only
			//@ts-ignore
			EntitiesBase.addObject(EntitiesBase.getEntityId(this.entity_name), this);
		}
	}

	destroy() {
		//@ts-ignore
		if(typeof EntitiesBase !== 'undefined')
			//@ts-ignore
			EntitiesBase.removeObject(EntitiesBase.getEntityId(this.entity_name), this);
	}

	update(delta: number) {
		this.timer += delta;

		if(this.timer < SPAWN_DURATION) {
			sc = this.timer / SPAWN_DURATION * SCALE;
			super.setScale(sc, sc);
		}
		else if(this.timer < SPAWN_DURATION + LIFETIME) {
			super.setScale(SCALE, SCALE);
		}
		else if(this.timer < SPAWN_DURATION + LIFETIME + BLINKING_TIME) {
			this.blink_percent += Math.min(0.1, delta) * 2.5;//blinking speed
			if(this.blink_percent > 1)
				this.blink_percent -= 2.0;
			//sc = SCALE-Utils::bezier_curve(ABS(blink_percent), Utils::EASE_IN_OUT)*0.0125f;
			sc = SCALE - ( Math.pow(Math.abs(this.blink_percent), 2) ) * 0.0125;
			super.setScale(sc, sc);
		}
		else {
			//sc = this.width - SHRINKING_SPEED*delta;
			sc = SCALE * ( 1.0 - 
				((this.timer - (SPAWN_DURATION + LIFETIME + BLINKING_TIME)) / SHRINKING_SPEED) );
			if(sc <= 0) {
				sc = 0;
				this.expired = true;
			}
			super.setScale(sc, sc);
		}

		super.update(delta);
	}

	static randomType() {
		let random_value = Math.random();//[0, 1]
		let prop_sum = 0;

		for(let i=0; i<PROBABILITIES.length; i++) {
			if(random_value < PROBABILITIES[i] + prop_sum)
				return i;
			prop_sum += PROBABILITIES[i];
		}
		throw new Error('Cannot get random index from PROBABILITIES');
	}

	static entityName(type: number) {
		switch(type) {
			default: throw new Error('Incorrect Item type');
			case ITEM_TYPES.HEALTH: return 'HEALTH_ITEM';
			case ITEM_TYPES.ENERGY: return 'ENERGY_ITEM';
			case ITEM_TYPES.SPEED: return 'SPEED_ITEM';
		}
	}
	
	public static readonly HEALTH_VALUE = 0.25;
	public static readonly ENERGY_VALUE = 0.2;
}