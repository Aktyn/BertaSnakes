const Effects = (function(Movement) {

	const SPEED_VALUE = 1.0;//should match DEFAULT_SPEED from bullet.js 

	const EFFECTS_SCHEMA = {//SCHEMA
		SPAWN_IMMUNITY: { duration: 3 },
		SHIELD: { 
			//id: 0,
			duration: 8//seconds
		},
		SPEED: { duration: 2 },
		POISONING: { duration: 0.5 }
	};

	var e_i = 0;

	for(var eff in EFFECTS_SCHEMA)
		EFFECTS_SCHEMA[eff].id = e_i++;

	const self = class {
		constructor(owner) {//@owner - Object2D that owns Effects instance
			this.owner = owner;
			this.a_effects = [];//active effects
		}

		clearAll() {//clears all effects
			this.a_effects = [];
		}

		active(effect) {
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

		isActive(effect) {
			for(e_i=0; e_i<this.a_effects.length; e_i++) {
				if(this.a_effects[e_i].id === effect.id)
					return true;
			}
			return false;
		}

		onEffectStart(effect) {
			switch(effect) {
				default: break;
				case EFFECTS_SCHEMA.SPEED:
					if(this.owner.movement !== undefined) {//affect object's movement
						this.owner.movement.set(Movement.LOCKED_SPEED, true);
						this.owner.movement.speed = SPEED_VALUE;
					}
					break;
			}
		}

		onEffectEnd(effect_id) {
			switch(effect_id) {
				default: break;
				case EFFECTS_SCHEMA.SPEED.id:
					if(this.owner.movement !== undefined) {//affect object's movement
						this.owner.movement.speed = this.owner.movement.maxSpeed;
						this.owner.movement.set(Movement.LOCKED_SPEED, false);
					}
					break;
			}
		}

		update(delta) {
			for(e_i=0; e_i<this.a_effects.length; e_i++) {
				if((this.a_effects[e_i].timer+=delta) >= this.a_effects[e_i].duration === true) {
					this.onEffectEnd( this.a_effects[e_i].id );
					this.a_effects.splice(e_i, 1);
					e_i--;
				}
			}
			//console.log(this.a_effects.length);
		}
	};

	for(let eff in EFFECTS_SCHEMA)
		self[eff] = EFFECTS_SCHEMA[eff];

	//console.log(self);

	return self;
})(
	typeof Movement !== 'undefined' ? Movement : require('./movement.js')
);

try {//export for NodeJS
	module.exports = Effects;
}
catch(e) {}