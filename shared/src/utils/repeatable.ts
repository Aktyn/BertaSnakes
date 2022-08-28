import { omit } from './common'

export interface RepeatableOptions<ArgsType extends []> {
  frequency: number
  functionArguments?: ArgsType

  /**
   * Runs function immediately instead of waiting {@link frequency} time for first execution
   * @default true
   * */
  runImmediately: boolean

  /** Prevents from starting on itself
   * @default false
   * */
  explicitStart?: boolean
}

export class Repeatable<ArgsType extends [] = []> {
  private readonly repeatableFunction: (...args: readonly [...ArgsType]) => void
  private readonly options: Omit<RepeatableOptions<ArgsType>, 'runImmediately'>

  private interval: ReturnType<typeof setInterval> | null = null

  constructor(
    repeatableFunction: (...args: readonly [...ArgsType]) => void,
    options: RepeatableOptions<ArgsType>,
  ) {
    this.repeatableFunction = repeatableFunction
    this.options = omit(options, 'runImmediately')
    if (!options.explicitStart) {
      this.start(options.runImmediately)
    }
  }

  start(runImmediately = true) {
    if (this.interval) {
      return
    }
    if (this.options.frequency < 0) {
      throw new Error('Frequency must be a non negative number')
    }
    if (runImmediately) {
      if (this.options.functionArguments) {
        this.repeatableFunction.apply(null, this.options.functionArguments)
      } else {
        this.repeatableFunction.apply(null)
      }
    }
    this.interval = setInterval(
      this.repeatableFunction,
      this.options.frequency,
      ...(this.options.functionArguments ?? []),
    ) as never
  }

  stop() {
    if (!this.interval) {
      return
    }
    clearInterval(this.interval)
    this.interval = null
  }
}
