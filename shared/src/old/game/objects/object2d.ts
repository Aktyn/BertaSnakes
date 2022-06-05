import Matrix2D from '../../utils/matrix2d'

export default class Object2D extends Matrix2D {
  private static instance_id = 0

  public timestamp: number
  public id: number
  public expired = false
  public frames_since_last_update = 0

  constructor() {
    super()

    //NOTE: client-side only use
    this.timestamp = Date.now() //timestamp of previous object update

    this.id = ++Object2D.instance_id
  }

  // public destroy(): void {}
  // public update(delta: number): void {}
  public destroy(): void {}
  public update(delta: number): void {}
}
