# Async queue for processing data

## Installation and Usage

### ES6 via npm

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

### Couple words about Typescript

If we providing types, it could be easy to queue:

```ts
const iterationFn = (value: string) => value
/**
 * value: string -> we have only 1 way how to pass entry value array it is a Array<string>
 */
const queue = new CreateAsyncQueue((value: string) => value, ['1', '2', '3'])
await queue.run()
```

```ts
const iterationFn = (value: boolean) => value
/**
 * value: boolean -> we have only 1 way how to pass entry value array it is a Array<boolean>
 */
const queue = new CreateAsyncQueue((value: string) => value, [true, false])
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
