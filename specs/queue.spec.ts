import { describe, expect, it, vi } from 'vitest'
import { CreateAsyncQueue } from '../index'

const helpFn = (item: string) => item
const entryData = ['1', '2', '3']

function waiter(time = 1000) {
  return new Promise(res => {
    setTimeout(() => {
      res({ time, rnd: Math.random() })
    }, time)
  })
}

describe('Async queue', () => {
  it('Run works for sample data', async () => {
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult()

    expect(res).toEqual([])
  })

  it('Run works with transform function', async () => {
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(item => item)

    expect(res).toEqual(entryData)
  })

  it('Run works with predicator function', async () => {
    const predicator = item => +item * 2
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)

    expect(res).toEqual(entryData.map(predicator))
  })

  it('Processed data resolved correctly', async () => {
    const predicator = item => +item * 2
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)
    const processed = queue.getProcessedData()

    expect(res).toEqual(entryData.map(predicator))
    expect(processed).toEqual(entryData)
  })

  it('Queued data prints correctly when queue fully awaited', async () => {
    const predicator = item => +item * 2
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)
    const queued = queue.getQueueData()

    expect(res).toEqual(entryData.map(predicator))
    expect(queued).toEqual([])
  })

  it('Resulted data retrieved correctly when transformed', async () => {
    const predicator = item => +item * 2
    const transformedData = entryData.map(predicator)
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)
    const resulted = queue.getResultedData()

    expect(res).toEqual(transformedData)
    expect(resulted).toEqual(transformedData)
  })

  it('Reset all, resetting all internal values, and reset queue', async () => {
    const predicator = item => +item * 2
    const transformedData = entryData.map(predicator)
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)
    const resulted = queue.getResultedData()

    expect(res).toEqual(transformedData)
    expect(resulted).toEqual(transformedData)
    const reversedEntryData = [...entryData].reverse()
    queue.resetAll(reversedEntryData)

    const resetResulted = queue.getResultedData()
    const processResulted = queue.getProcessedData()
    const queueResulted = queue.getQueueData()

    expect(resetResulted).toEqual([])
    expect(processResulted).toEqual([])
    expect(queueResulted).toEqual(reversedEntryData)
  })

  it('Queue data push correctly adjusted', async () => {
    const predicator = item => +item * 2
    const reversedEntryData = [...entryData].reverse()
    const transformedData = entryData.map(predicator)
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)

    expect(res).toEqual(transformedData)
    expect(queue.getQueueData()).toEqual([])
    queue.push(reversedEntryData)

    expect(queue.getQueueData()).toEqual(reversedEntryData)
  })

  it('Processed, resulted and queued data handled correctly', async () => {
    const predicator = item => +item * 2
    const reversedEntryData = [...entryData].reverse()
    const transformedData = entryData.map(predicator)
    const queue = new CreateAsyncQueue(helpFn, entryData)
    const res = await queue.runWithResult(predicator)

    expect(res).toEqual(transformedData)
    expect(queue.getQueueData()).toEqual([])
    queue.push(reversedEntryData)

    expect(queue.getQueueData()).toEqual(reversedEntryData)

    await queue.run()

    expect(queue.getQueueData()).toEqual([])
    expect(queue.getResultedData()).toEqual(
      transformedData.concat(reversedEntryData.map(predicator)),
    )

    expect(queue.getProcessedData()).toEqual(
      entryData.concat(reversedEntryData),
    )
  })
})
