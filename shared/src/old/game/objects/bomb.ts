import Object2D from './object2d'
import Colors, { ColorI } from './../common/colors'
import Player from './player'

declare var _CLIENT_: boolean
if (_CLIENT_) {
  // noinspection ES6ConvertVarToLetConst
  var EntitiesBase = require('../../../client/game/entities').default
}

const SCALE = 0.075,
  GROW_SCALE = 0.075,
  SHAKING_RADIUS = 0.02
const DELAY_TIME = 2,
  SHAKING_TIME = 2

let shake_factor, rand_a, sc

export default class Bomb extends Object2D {
  public parent: Player
  private readonly initial_x: number
  private readonly initial_y: number
  private timer: number

  //NOTE - parent must contains a Painter instance as 'painter' property name
  //@parent - instance that 'owns' this bullet
  constructor(x: number, y: number, parent: Player) {
    super()
    super.setPos(x, y)
    super.setScale(SCALE, SCALE)

    //this.color = color;//color works as a player signature
    this.parent = parent

    this.initial_x = x
    this.initial_y = y

    this.timer = 0

    if (_CLIENT_) {
      EntitiesBase = require('../../../client/game/entities').default
      if (typeof EntitiesBase !== 'undefined') {
        //@ts-ignore
        this.entity_name = Bomb.entityName(parent.painter.color) //client-side only
        //@ts-ignore
        EntitiesBase.addObject(EntitiesBase.getEntityId(this.entity_name), this)
      }
    }
  }

  destroy() {
    if (typeof EntitiesBase !== 'undefined')
      //@ts-ignore
      EntitiesBase.removeObject(
        EntitiesBase.getEntityId(this.entity_name),
        this,
      )
  }

  update(delta: number) {
    if ((this.timer += delta) >= DELAY_TIME + SHAKING_TIME) {
      this.expired = true
      return
    }

    if (this.timer > DELAY_TIME) {
      shake_factor = (this.timer - DELAY_TIME) / SHAKING_TIME

      rand_a = Math.random() * Math.PI * 2.0
      super.setPos(
        this.initial_x + Math.cos(rand_a) * SHAKING_RADIUS * shake_factor,
        this.initial_y + Math.sin(rand_a) * SHAKING_RADIUS * shake_factor,
      )

      super.setRot((Math.random() * 2.0 - 1.0) * Math.PI * shake_factor * 0.25)

      sc = SCALE + GROW_SCALE * Math.pow(shake_factor, 4)
      super.setScale(sc, sc)
    }
  }

  static entityName(color: ColorI) {
    return 'BOMB_' + Colors.PLAYERS_COLORS.indexOf(color)
  }
}
