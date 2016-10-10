'use strict'

define([
  'lodash'
], (
  _
) => {
  const SystemClock = {
    now: () => Date.now(),
    defer: _.defer,
    delay: _.delay,
    cancel: timerId => {
      clearTimeout(timerId)
    }
  }

  const TestClock = () => {
    let now = 0
    let queue = []
    let timerId = 0

    return {
      now: () => now,
      defer: (func, ...args) => {
        timerId++
        queue.push({func, args, timerId ,time: now})
        return timerId
      },
      delay: (func, wait, ...args) => {
        timerId++
        queue.push({func, args, timerId, time: now + wait})
        return timerId
      },
      cancel: timerId => {
        queue = _.reject(queue, {timerId})
      },
      tick: millis => {
        now += millis
        let dueCalls
        [dueCalls, queue] = _.partition(queue, call => call.time < now)

        _.forEach(dueCalls, ({func, args}) => {
          func(...args)
        })
      }
    }
  }

  return {SystemClock, TestClock}
})