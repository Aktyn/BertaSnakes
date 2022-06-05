function extendType<T>(target: T): T & { [index: string]: ShapeI } {
  return target as T & { [index: string]: ShapeI }
}

export interface ShapeI {
  [index: string]: number[][]
}

export const SENSOR_SHAPES = extendType({
  TRIANGLE: [
    [0.0, 1.0],
    [-1.0, -1.0],
    [1.0, -1.0],
    [-0.5, 0.0],
    [0.5, 0.0],
  ],
  SQUARE: [
    [0.0, 1.0],
    [-1.0, -1.0],
    [1.0, -1.0],
    [-0.5, 0.0],
    [0.5, 0.0],
  ],
  PENTAGON: [
    [0.0, 1.0],
    [-0.5, 1.0],
    [0.5, 1.0],
    [-0.5, -1.0],
    [0.5, -1.0],
    [-1.0, -0.5],
    [1.0, -0.5],
  ],

  ROCKET: [
    [0.0, 1.0],
    [-1.0, -0.9],
    [1.0, -0.9],
    [-0.5, 0.5],
    [0.5, 0.5],
  ],
  CIRCLE: new Array(8).fill(0).map((_, index, arr) => {
    let a = Math.PI * 2.0 * (index / arr.length) + Math.PI / 2
    return [Math.cos(a), Math.sin(a)].map((v) => (Math.abs(v) < 1e-10 ? 0 : v))
  }),
  BULLET: [
    [0.0, 1.0],
    [0.0, -1.0],
    [-0.5, 0.5],
    [0.5, 0.5],
    [-0.5, -0.5],
    [0.5, -0.5],
  ],
})

export default class Sensor {
  public shape: number[][]

  constructor(shape: number[][]) {
    this.shape = shape || SENSOR_SHAPES.TRIANGLE //default shape
  }
}
