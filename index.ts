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
  private queue!: Map<MapKeys, Set<Props>>
  private queueSet!: Set<Props>
  private processedSet!: Set<Props>
  private options!: Options
  private useIteration!: Iteration
  private resulted: Array<ReturnType<(args: ReturnType<Iteration>) => any>> = []
  private runCallback?: (args: ReturnType<Iteration>) => any


  constructor(useIteration: Iteration, iterationProps: Props) {
    this.initialization(useIteration, iterationProps)
    this.bindFunctions()
  }

  private initialization(useIteration: Iteration, iterationProps: Props) {
    this.useIteration = useIteration

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
  async run<Fn extends (args: ReturnType<Iteration>) => any>(
    callback?: Fn,
    isCallbackShouldBeSkipped: boolean = false,
  ) {
    if (callback) {
      this.runCallback = callback
    }
    const memoizedCb = callback || this.runCallback
    for await (let item of this.gen()) {
      if (memoizedCb && !isCallbackShouldBeSkipped) {
        const res = await memoizedCb(item)
        this.resulted.push(res)
      }
    }

    return this.resulted
  }

  private setToDefault() {
    this.options = {
      isAborted: false,
    }

    this.queue = new Map<MapKeys, Set<Props>>()
    this.resulted = []
  }

  getProcessedData() {
    return [...this.getProcessed()]
  }

  getQueueData() {
    return [...this.getQueue()]
  }

  getResultedData() {
    return this.resulted
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
