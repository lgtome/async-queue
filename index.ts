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
type EmitEvents = 'running' | 'stopping'
class LocalEmitter {
  subscribers = new Map<EmitEvents, Set<Function>>()

  emit(emittedEvent: EmitEvents) {
    this.subscribers.forEach((set, event) => {
      if (emittedEvent === event) {
        set.forEach(fn => {
          fn()
        })
      }
    })
  }
  subscribe(event: EmitEvents, fn: Function) {
    const set = this.subscribers.get(event)
    if (!set) {
      this.subscribers.set(event, new Set([fn]))
      return
    }
    set.add(fn)
    this.subscribers.set(event, set)
  }
  unsubscribe(event: EmitEvents, fn: Function) {
    const set = this.subscribers.get(event)
    if (!set) {
      return
    }
    set.delete(fn)
  }
}

export class CreateAsyncQueue<
  Iteration extends FunctionExtended = FunctionExtended,
  Props extends ParametersWithArg<Iteration> = ParametersWithArg<Iteration>,
> {
  private queue!: Map<MapKeys, Set<Props> | Array<Props>>
  private queueSet!: Set<Props>
  private processedSet!: Array<Props>
  private options!: Options
  private useIteration!: Iteration
  private resulted: Array<ReturnType<(args: ReturnType<Iteration>) => any>> = []
  private runCallback?: (args: ReturnType<Iteration>) => any
  private isRunning: boolean = false
  private emitter: LocalEmitter
  constructor(useIteration: Iteration, iterationProps: Props) {
    this.emitter = new LocalEmitter()
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
    return this.queue.get('processed') as Array<Props>
  }
  private bindFunctions() {
    this.resume = this.resume.bind(this)
    this.stop = this.stop.bind(this)
    this.push = this.push.bind(this)
    this.run = this.run.bind(this)
    this.getResultedData = this.getResultedData.bind(this)
    this.getProcessedData = this.getProcessedData.bind(this)
    this.getQueueData = this.getQueueData.bind(this)
    this.resetAll = this.resetAll.bind(this)
  }
  private fillQueue(iterationProps?: Props) {
    this.queue.set('queue', new Set(iterationProps))
    this.queue.set('processed', [])
  }

  private async *gen() {
    for (let prop of [...this.queueSet]) {
      this.emitRunning()
      if (this.options.isAborted) {
        this.emitStopping()
        return
      }
      const preparedData = Array.isArray(prop) ? [...prop] : [prop]
      yield await this.useIteration(...preparedData)

      this.queueSet.delete(prop)
      this.processedSet.push(prop)
      this.emitStopping()
    }
  }
  async run<Fn extends (args: ReturnType<Iteration>) => any>(
    callback?: Fn,
    isCallbackShouldBeSkipped: boolean = false,
  ) {
    return this.runWithOption(this, callback, isCallbackShouldBeSkipped)
  }
  async runWithResult<Fn extends (args: ReturnType<Iteration>) => any>(
    callback?: Fn,
    isCallbackShouldBeSkipped: boolean = false,
  ) {
    return this.runWithOption(
      this.resulted,
      callback,
      isCallbackShouldBeSkipped,
    )
  }

  private async runWithOption<
    Option,
    Fn extends (args: ReturnType<Iteration>) => any,
  >(
    resultOption: Option,
    callback?: Fn,
    isCallbackShouldBeSkipped: boolean = false,
  ) {
    if (callback) {
      this.runCallback = callback
    }
    if (this.isRunning) {
      await this.awaitRunning()
    }
    if (!this.queueSet.size) {
      return resultOption
    }
    const establishedCallback = this.runCallback
    for await (let item of this.gen()) {
      if (establishedCallback && !isCallbackShouldBeSkipped) {
        const res = await establishedCallback(item)
        this.resulted.push(res)
      }
    }

    return resultOption
  }
  private awaitRunning() {
    return new Promise(res => {
      this.emitter.subscribe('stopping', res)
    })
  }
  private emitRunning() {
    this.isRunning = true
    this.emitter.emit('running')
  }
  private emitStopping() {
    this.isRunning = false
    this.emitter.emit('stopping')
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
