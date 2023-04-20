export class CreateAsyncQueue {
    queue;
    queueSet;
    processedSet;
    options;
    useIteration;
    iterationProps;
    constructor(useIteration, iterationProps) {
        this.initialization(useIteration, iterationProps);
        this.bindFunctions();
    }
    initialization(useIteration, iterationProps) {
        this.useIteration = useIteration;
        this.iterationProps = iterationProps;
        this.setToDefault();
        this.fillQueue(iterationProps);
        this.queueSet = this.getQueue();
        this.processedSet = this.getProcessed();
    }
    getQueue() {
        return this.queue.get('queue');
    }
    getProcessed() {
        return this.queue.get('processed');
    }
    bindFunctions() {
        this.resume = this.resume.bind(this);
        this.stop = this.stop.bind(this);
        this.push = this.push.bind(this);
        this.run = this.run.bind(this);
    }
    fillQueue(iterationProps) {
        this.queue.set('queue', new Set(iterationProps));
        this.queue.set('processed', new Set());
    }
    async *gen() {
        for (let prop of [...this.queueSet]) {
            if (this.options.isAborted) {
                return;
            }
            const preparedData = Array.isArray(prop) ? [...prop] : [prop];
            yield await this.useIteration(...preparedData);
            this.queueSet.delete(prop);
            this.processedSet.add(prop);
        }
    }
    async run(callback) {
        const result = [];
        for await (let item of this.gen()) {
            if (callback) {
                const res = await callback(item);
                result.push(res);
            }
        }
        return result;
    }
    setToDefault() {
        this.options = {
            isAborted: false,
        };
        this.queue = new Map();
    }
    getProcessedData() {
        return [...this.getProcessed()];
    }
    getQueueData() {
        return [...this.getQueue()];
    }
    resetAll(iterationProps) {
        this.setToDefault();
        this.fillQueue(iterationProps);
    }
    stop() {
        this.options.isAborted = true;
        return this;
    }
    async resume() {
        this.options.isAborted = false;
        if (this.queueSet.size) {
            return this.run();
        }
        return this;
    }
    push(data) {
        data.forEach(item => this.queueSet.add(item));
        return this;
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
