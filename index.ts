type FunctionExtended = (...rest: any[]) => any
export type TupleToUnion<T extends any[]> = T[number]
export type GetSecondArgument<T extends any[]> = T[1]
export type Nullable = undefined | null | never | void
export type ParametersWithArg<Fn = (...args: any[]) => any> = Fn extends (
  ...args: infer Args
) => any
  ? GetSecondArgument<Args> extends Nullable
    ? Array<TupleToUnion<Args>>
    : Array<Args>
  : never
type MapKeys = 'queue' | 'processed'
type Options = { isAborted: boolean }

export class CreateAsyncQueue<
  Iteration extends FunctionExtended = FunctionExtended,
  Props extends ParametersWithArg<Iteration> = ParametersWithArg<Iteration>,
> {
  queue!: Map<MapKeys, Set<Props>>
  queueSet!: Set<Props>
  processedSet!: Set<Props>
  options!: Options
  useIteration!: Iteration
  iterationProps!: Props

  constructor(useIteration: Iteration, iterationProps: Props) {
    this.initialization(useIteration, iterationProps)
    this.bindFunctions()
  }

  private initialization(useIteration: Iteration, iterationProps: Props) {
    this.useIteration = useIteration
    this.iterationProps = iterationProps

    this.setToDefault()

    this.fillQueue(iterationProps)
    this.queueSet = this.getQueue()
    this.processedSet = this.getProcessed()
  }
  private getQueue() {
    return this.queue.get('queue') as Set<Props>
  }
  private getProcessed() {
    return this.queue.get('processed') as Set<Props>
  }
  private bindFunctions() {
    this.resume = this.resume.bind(this)
    this.stop = this.stop.bind(this)
    this.push = this.push.bind(this)
    this.run = this.run.bind(this)
  }
  private fillQueue(iterationProps: Props) {
    this.queue.set('queue', new Set(iterationProps))
    this.queue.set('processed', new Set())
  }

  private async *gen() {
    for (let prop of [...this.queueSet]) {
      if (this.options.isAborted) {
        return
      }
      const preparedData = Array.isArray(prop) ? [...prop] : [prop]
      yield await this.useIteration(...preparedData)

      this.queueSet.delete(prop)
      this.processedSet.add(prop)
    }
  }
  async run<Fn extends (args: ReturnType<Iteration>) => any>(callback?: Fn) {
    const result = [] as Array<ReturnType<Fn>>
    for await (let item of this.gen()) {
      if (callback) {
        const res = await callback(item)
        result.push(res)
      }
    }

    return result
  }

  private setToDefault() {
    this.options = {
      isAborted: false,
    }

    this.queue = new Map<MapKeys, Set<Props>>()
  }

  getProcessedData() {
    return [...this.getProcessed()]
  }

  getQueueData() {
    return [...this.getQueue()]
  }

  resetAll(iterationProps: Props) {
    this.setToDefault()
    this.fillQueue(iterationProps)
  }

  stop() {
    this.options.isAborted = true
    return this
  }

  async resume() {
    this.options.isAborted = false
    if (this.queueSet.size) {
      return this.run()
    }
    return this
  }

  push(data: Props) {
    data.forEach(item => this.queueSet.add(item))
    return this
  }
}

/**
 * @tests
 */

// function waiter(time = 1000) {
//   return new Promise(res => {
//     setTimeout(() => {
//       res(Math.random())
//     }, time)
//   })
// }

// const s = new CreateAsyncQueue(waiter, [2000, 2000])
// s.run(item => console.log(item)).then(d => console.log('THEN', d))
// console.log('hm...start', s)
// waiter(1500)
//   .then(() => {
//     console.log('hm...stop')
//     s.stop()
//   })
//   .then(() => {
//     waiter(1000)
//     console.log('awaited')
//   })
//   .then(() => {
//     s.push([4000])
//     console.log('pushed...')
//   })
//   .then(s.resume)
//   .then(s => console.log(s, 'seems it is end'))
// //.then(s.resume)
// console.log('!!@!@!@')
