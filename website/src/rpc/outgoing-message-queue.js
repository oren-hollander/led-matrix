'use strict'

define([
  'rpc/priority'
], (
  {MessagePriorities}
) => {

  function OutgoingMessageQueue(onDrain, clock) {

    let queue = []
    let timerId
    let nextScheduleTime

    function scheduleDrain(delay) {
      const scheduleTime = clock.now() + delay
      if(queue.length === 0 || scheduleTime < nextScheduleTime){
        clock.cancel(timerId)
        timerId = clock.delay(drainQueue, delay)
        nextScheduleTime = scheduleTime
      }
    }

    function schedule(rpcMessage, priority) {
      if(priority === MessagePriorities.Immediate) {
        queue.push(rpcMessage)
        drainQueue()
      }
      else {
        scheduleDrain(priority)
        queue.push(rpcMessage)
      }
    }

    function drainQueue() {
      onDrain(queue)
      queue = []
    }

    return {schedule}
  }

  return OutgoingMessageQueue
})