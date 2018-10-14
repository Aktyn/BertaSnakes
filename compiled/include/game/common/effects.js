"use strict";
///<reference path="../objects/object2d.ts"/>
///<reference path="movement.ts"/>
var EffectsScope;
(function (EffectsScope) {
    try {
        var _Movement_ = require('./movement');
    }
    catch (e) {
        var _Movement_ = Movement;
    }
    const SPEED_VALUE = 1.0; //should match DEFAULT_SPEED from bullet.js 
    const EFFECTS_SCHEMA = {
        SPAWN_IMMUNITY: { duration: 3 },
        SHIELD: {
            //id: 0,
            duration: 8 //seconds
        },
        SPEED: { duration: 2 },
        POISONING: { duration: 0.5 }
    };
    var e_i = 0;
    // for(var eff in EFFECTS_SCHEMA)
    // 	EFFECTS_SCHEMA[eff].id = e_i++;
    for (var eff in EFFECTS_SCHEMA) {
        //@ts-ignore
        EFFECTS_SCHEMA[eff].id = e_i++;
    }
    class Effects {
        constructor(owner) {
            this.a_effects = [];
            this.owner = owner;
            //this.a_effects = [];//active effects
        }
        clearAll() {
            this.a_effects = [];
        }
        active(effect) {
            this.onEffectStart(effect);
            //renew effect duration if one is already active
            for (e_i = 0; e_i < this.a_effects.length; e_i++) {
                if (this.a_effects[e_i].id === effect.id) {
                    this.a_effects[e_i].timer = 0;
                    return;
                }
            }
            this.a_effects.push({
                id: effect.id,
                duration: effect.duration || 0,
                timer: 0
            });
        }
        isActive(effect) {
            for (e_i = 0; e_i < this.a_effects.length; e_i++) {
                if (this.a_effects[e_i].id === effect.id)
                    return true;
            }
            return false;
        }
        onEffectStart(effect) {
            switch (effect) {
                default: break;
                case EFFECTS_SCHEMA.SPEED:
                    if (this.owner.movement !== undefined) { //affect object's movement
                        this.owner.movement.set(_Movement_.FLAGS.LOCKED_SPEED, true);
                        this.owner.movement.speed = SPEED_VALUE;
                    }
                    break;
            }
        }
        onEffectEnd(effect_id) {
            switch (effect_id) {
                default: break;
                case EFFECTS_SCHEMA.SPEED.id:
                    if (this.owner.movement !== undefined) { //affect object's movement
                        this.owner.movement.speed = this.owner.movement.maxSpeed;
                        this.owner.movement.set(_Movement_.FLAGS.LOCKED_SPEED, false);
                    }
                    break;
            }
        }
        update(delta) {
            for (e_i = 0; e_i < this.a_effects.length; e_i++) {
                if ((this.a_effects[e_i].timer += delta) >= this.a_effects[e_i].duration === true) {
                    this.onEffectEnd(this.a_effects[e_i].id);
                    this.a_effects.splice(e_i, 1);
                    e_i--;
                }
            }
            //console.log(this.a_effects.length);
        }
    }
    Effects.TYPES = EFFECTS_SCHEMA;
    EffectsScope.Effects = Effects;
    //Object.assign(Effects, EFFECTS_SCHEMA);
})(EffectsScope || (EffectsScope = {}));
const Effects = EffectsScope.Effects;
try { //export for NodeJS
    module.exports = Effects;
}
catch (e) { }
