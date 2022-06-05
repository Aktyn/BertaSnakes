import { ColorI } from './colors'
import { Vec2f } from '../../utils/vector'

const DEFAULT_THICKNESS = 0.015

export default class Painter {
  public lastPos: Vec2f //Vector;
  public color: ColorI
  public thickness: number
  public active = false

  constructor(color: ColorI, thickness: number) {
    this.lastPos = new Vec2f(0, 0) //for painting purposes
    this.color = color
    this.thickness = thickness || DEFAULT_THICKNESS
  }
}
