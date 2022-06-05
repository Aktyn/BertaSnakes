import Object2D from '../objects/object2d'
import Movement, { MOVEMENT_FLAGS } from './movement'

interface ActiveEffect {
  id: number
  duration: number
  timer: number
}

interface EffectSchema {
  id: number
  duration: number
}

interface InteractiveObject extends Object2D {
  movement: Movement
}

function extendType<T>(maps_literal: T): T & { [index: string]: EffectSchema } {
  return maps_literal as T & { [index: string]: EffectSchema }
}

export const AVAILABLE_EFFECTS = extendType({
  //SCHEMA
  SPAWN_IMMUNITY: <EffectSchema>{ duration: 3 },
  SHIELD: <EffectSchema>{
    //id: 0,
    duration: 8, //seconds
  },
  SPEED: <EffectSchema>{ duration: 2 },
  POISONING: <EffectSchema>{ duration: 0.5 },
})

let e_i = 0

for (let eff in AVAILABLE_EFFECTS) {
  //@ts-ignore
  AVAILABLE_EFFECTS[eff].id = e_i++
}

const SPEED_VALUE = 1.0 //should match DEFAULT_SPEED from bullet.ts

export default class Effects {
  //public static TYPES = AVAILABLE_EFFECTS;

  private owner: InteractiveObject
  private a_effects: ActiveEffect[] = []

  constructor(owner: Object2D) {
    //@owner - Object2D that owns Effects instance
    this.owner = <InteractiveObject>owner
    //this.a_effects = [];//active effects
  }

  clearAll() {
    //clears all effects
    this.a_effects = []
  }

  active(effect: EffectSchema) {
    this.onEffectStart(effect)

    //renew effect duration if one is already active
    for (e_i = 0; e_i < this.a_effects.length; e_i++) {
      if (this.a_effects[e_i].id === effect.id) {
        this.a_effects[e_i].timer = 0
        return
      }
    }

    this.a_effects.push({
      id: effect.id, //AVAILABLE_EFFECTS reference
      duration: effect.duration || 0,
      timer: 0,
    })
  }

  isActive(effect: EffectSchema) {
    for (e_i = 0; e_i < this.a_effects.length; e_i++) {
      if (this.a_effects[e_i].id === effect.id) return true
    }
    return false
  }

  onEffectStart(effect: EffectSchema) {
    // noinspection JSRedundantSwitchStatement
    switch (effect) {
      default:
        break
      case AVAILABLE_EFFECTS.SPEED:
        if (this.owner.movement !== undefined) {
          //affect object's movement
          this.owner.movement.set(MOVEMENT_FLAGS.LOCKED_SPEED, true)
          this.owner.movement.speed = SPEED_VALUE
        }
        break
    }
  }

  onEffectEnd(effect_id: number) {
    // noinspection JSRedundantSwitchStatement
    switch (effect_id) {
      default:
        break
      case AVAILABLE_EFFECTS.SPEED.id:
        if (this.owner.movement !== undefined) {
          //affect object's movement
          this.owner.movement.speed = this.owner.movement.maxSpeed
          this.owner.movement.set(MOVEMENT_FLAGS.LOCKED_SPEED, false)
        }
        break
    }
  }

  update(delta: number) {
    for (e_i = 0; e_i < this.a_effects.length; e_i++) {
      if (
        (this.a_effects[e_i].timer += delta) >= this.a_effects[e_i].duration
      ) {
        this.onEffectEnd(this.a_effects[e_i].id)
        this.a_effects.splice(e_i, 1)
        e_i--
      }
    }
    //console.log(this.a_effects.length);
  }
}
