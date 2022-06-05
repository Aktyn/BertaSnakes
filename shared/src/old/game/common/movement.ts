import Object2D from '../objects/object2d'

interface MovementOptionsI {
  maxSpeed?: number
  acceleration?: number
  turnSpeed?: number
}

const PI_2 = Math.PI * 2
const fixAngle = (a: number) => -a + Math.PI / 2
let rot = 0

export const enum MOVEMENT_FLAGS {
  LEFT = 1 << 0,
  RIGHT = 1 << 1,
  UP = 1 << 2,
  DOWN = 1 << 3,
  LOCKED_SPEED = 1 << 4,
}

export default class Movement {
  /*public static FLAGS = {
		LEFT: 	1 << 0,
		RIGHT: 	1 << 1,
		UP: 	1 << 2,
		DOWN: 	1 << 3,
		LOCKED_SPEED: 1 << 4
	};*/

  public speed = 0
  private _state = 0
  public smooth = true

  public maxSpeed = 0.4
  public acceleration = 0.5
  public turnSpeed = Math.PI

  constructor() {
    //EMPTY SINCE ALL PARAMS ARE INITIALIZED ABOVE
  }

  set(flag: MOVEMENT_FLAGS, enable = false) {
    if (enable) this._state |= flag
    else this._state &= ~flag
  }

  /*isFlagEnabled(flag: number) {
		return !!(this._state & flag);
	}*/

  resetState(): void {
    this._state = 0
  }

  setMaxSpeed(): void {
    this.speed = this.maxSpeed
  }

  get state() {
    return this._state
  }
  set state(value: number) {
    this._state = value
  }

  setOptions(opt: MovementOptionsI) {
    if (opt.maxSpeed) this.maxSpeed = opt.maxSpeed
    if (opt.acceleration) this.acceleration = opt.acceleration
    if (opt.turnSpeed) this.turnSpeed = opt.turnSpeed
  }

  applyMove(object: Object2D, delta: number) {
    if ((this._state & MOVEMENT_FLAGS.LOCKED_SPEED) === 0) {
      if (this._state & MOVEMENT_FLAGS.UP)
        this.speed = Math.min(
          this.speed + this.acceleration * delta,
          this.maxSpeed,
        )
      if (this._state & MOVEMENT_FLAGS.DOWN)
        this.speed = Math.max(this.speed - this.acceleration * delta, 0)
    }
    rot = object.rot
    if (this._state & MOVEMENT_FLAGS.LEFT) rot -= delta * this.turnSpeed
    if (this._state & MOVEMENT_FLAGS.RIGHT) rot += delta * this.turnSpeed
    while (rot < 0) rot += PI_2
    while (rot > PI_2) rot -= PI_2

    //@ts-ignore
    object.setRot(rot, !this.smooth)

    object.move(
      Math.cos(fixAngle(rot)) * delta * this.speed,
      Math.sin(fixAngle(rot)) * delta * this.speed,
    )
  }
}
