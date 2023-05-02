# Async queue for processing data

~96% code coverage ✨

Zero dependencies ✨

## Installation and Usage

### ES2018 via npm

```shell
npm install async-queued
```

```ts
import { CreateAsyncQueue } from 'async-queued'

const queue = new CreateAsyncQueue((value: string) => value, ['1', '2', '3'])
await queue.run()
```

or if you want to transform every item after queue iteration:

```ts
import { CreateAsyncQueue } from 'async-queued'

const queue = new CreateAsyncQueue((value: string) => {
  ...you can do anything with passed value (value from entry array)
  return value
}, ['1', '2', '3'])
await queue.run((item) => {
  ...do all with iteration item
})
```

## Documentation

You can see sample usage in [Installation and Usage](#installation-and-usage) heading, but this library do more.
So the simple example with extended function here:

```ts
const queue = new CreateAsyncQueue((value: string) => value, ['1', '2', '3'])
await queue.run()

queue.push(['3', '2', '1'])

queue.run()
...

...

queue.stop()
...

...
await queue.resume()

queue.getResultedData()
```

If you want to pass function with multiple arguments, you can:

```ts
const queue = new CreateAsyncQueue(
  (first: string, second: number) => first + second,
  [
    ['1', 1],
    ['2', 2],
  ],
)
await queue.run()
```

If you want to control, log or transform every queue item after awaiting, you can pass function to run:

```ts
const queue = new CreateAsyncQueue((value: string) => value, ['1', '2', '3'])
await queue.run((item) => {
  ...do with item everything
})
```

it will be invoked on every iteration.

Also, if you invoke run function second time and don't want to invoke previous function passed, you can suppress this:

```ts
const queue = new CreateAsyncQueue((value: string) => value, ['1', '2', '3'])
await queue.run((item) => {
  ...
})

...

await queue.run(null, false)
```

just pass the second argument as `false` to suppress invocation

### API

#### **Stop**

Stop function that just stopping all future Promises, but not current.

```ts
/**
 * @returns CreateAsyncQueue instance
 */
queue.stop()
```

#### **Resume**

Resume function that just resume current queue.

```ts
/**
 * @returns CreateAsyncQueue instance
 */
queue.resume()
```

#### **Push**

Push function that just push values to current queue.

```ts
/**
 * @entry Array of { values }
 * @returns CreateAsyncQueue instance
 */
queue.push([1, 2, 3])
```

#### **resetAll**

resetAll function that just reset queue and set queue data.

```ts
/**
 * @entry Array of { values }
 * @returns CreateAsyncQueue instance
 */
queue.resetAll()
```

#### **getResultedData**

getResultedData function that just return resulted after queue data.

```ts
/**
 * @returns Array of { values }
 */
queue.getResultedData()
```

#### **getQueueData**

getQueueData function that just return data to current queue, that need to be processed.

```ts
/**
 * @returns Array of { values }
 */
queue.getQueueData()
```

#### **getProcessedData**

getProcessedData function that just return data that already processed, but not resulted.

```ts
/**
 * @returns Array of { values }
 */
queue.getProcessedData()
```

### Couple words about Typescript

If we providing types, it could be easy to queue:

```ts
const iterationFn = (value: string) => value
/**
 * value: string -> we have only 1 way how to pass entry value array it is a Array<string>
 */
const queue = new CreateAsyncQueue(iterationFn, ['1', '2', '3'])
await queue.run()
```

```ts
const iterationFn = (value: boolean) => value
/**
 * value: boolean -> we have only 1 way how to pass entry value array it is a Array<boolean>
 */
const queue = new CreateAsyncQueue(iterationFn, [true, false])
await queue.run()
```

## Goals

- Smaller overall bundles sizes
- Provide better performance than solutions with Promise.all or smth like that
- Remove Promise all for awaiting iterable data

## Building/Testing

- `yarn compile` build everything
- `yarn serve` run locally
- `yarn tests` run tests
