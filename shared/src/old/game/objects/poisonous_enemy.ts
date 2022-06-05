import Enemy from './enemy'
import { SENSOR_SHAPES } from '../common/sensor'

const ENTITY_NAME = 'ENEMY_POISONOUS'
const SCALE = 0.1,
  MAX_SPEED = 0.3

const STAINS_FREQUENCY = 0.2,
  MAX_FAZE_DURATION = 5,
  MAX_GAP_DURATION = 20

export default class PoisonousEnemy extends Enemy {
  private on_stain_listener: ((arg: PoisonousEnemy) => void) | null

  private time_to_next_stain: number
  private faze_duration: number
  private gap_duration: number

  constructor() {
    super(ENTITY_NAME, SENSOR_SHAPES.CIRCLE, SCALE, MAX_SPEED)

    this.on_stain_listener = null
    this.time_to_next_stain = (Math.random() + 0.5) * STAINS_FREQUENCY

    this.faze_duration = 0
    this.gap_duration = MAX_FAZE_DURATION * Math.random()
  }

  destroy() {
    super.destroy()
  }

  onStain(on_stain_listener: (arg: PoisonousEnemy) => void) {
    this.on_stain_listener = on_stain_listener
  }

  update(delta: number) {
    super.update(delta)

    if (!this.spawning) {
      //if(!_CLIENT_) {//only server-side
      if (typeof module !== 'undefined') {
        if (this.gap_duration <= 0) {
          if ((this.faze_duration -= delta) < 0)
            //end of faze
            this.gap_duration = Math.random() * MAX_GAP_DURATION
          else {
            if ((this.time_to_next_stain -= delta) <= 0) {
              this.time_to_next_stain += STAINS_FREQUENCY

              if (this.on_stain_listener !== null) this.on_stain_listener(this)
            }
          }
        } else {
          if ((this.gap_duration -= delta) <= 0)
            //end of gap
            this.faze_duration = Math.random() * MAX_FAZE_DURATION
        }
      }
    }
  }
}
