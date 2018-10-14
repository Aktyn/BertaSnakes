///<reference path="object2d.ts"/>
////<reference path="../../../client/game/entities.ts"/>

const Item = (function() {
	try {
		var _Object2D_: typeof Object2D = require('./object2d');
	}
	catch(e) {
		var _Object2D_ = Object2D;
	}

	enum TYPES {//enum
		HEALTH,
		SPEED,
		ENERGY
	}
	//NOTE - sum of this array must be equal to 1 and it must be sorted with ascending order
	const PROBABILITIES = [0.1, 0.2, 0.7];

	const SCALE = 0.075;

	//lifetime in seconds
	const SPAWN_DURATION = 1, LIFETIME = 15, BLINKING_TIME = 2.5, SHRINKING_SPEED = 0.2;

	var sc = 0;

	return class Item extends _Object2D_ {
		public type: TYPES;

		private blink_percent = 0;
		private timer = 0;

		private entity_name?: string;

		constructor(_type: TYPES) {
			super();
			super.setScale(0, 0);

			this.type = _type;
			
			// this.blink_percent = 0;
			// this.timer = 0;

			//@ts-ignore
			if(typeof Entities !== 'undefined') {
				this.entity_name = Item.entityName(_type);//clientside only
				//@ts-ignore
				Entities.addObject(Entities[this.entity_name].id, this);
			}
		}

		destroy() {
			//@ts-ignore
			if(typeof Entities !== 'undefined')
				//@ts-ignore
				Entities.removeObject(Entities[this.entity_name].id, this);
			
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

			for(var i=0; i<PROBABILITIES.length; i++) {
				if(random_value < PROBABILITIES[i] + prop_sum)
					return i;
				prop_sum += PROBABILITIES[i];
			}
			throw new Error('Cannot get random index from PROBABILITIES');
			//return (Math.random() * Object.values(TYPES).length) | 0;
		}

		public static get TYPES() {
			return TYPES;
		}

		static entityName(type: TYPES) {
			switch(type) {
				default: throw new Error('Incorrect Item type');
				case TYPES.HEALTH: return 'HEALTH_ITEM';
				case TYPES.ENERGY: return 'ENERGY_ITEM';
				case TYPES.SPEED: return 'SPEED_ITEM';
			}
		}

		static get HEALTH_VALUE() {
			return 0.25;
		}

		static get ENERGY_VALUE() {
			return 0.2;
		}
	};
})();

try {//export for NodeJS
	module.exports = Item;
}
catch(e) {}