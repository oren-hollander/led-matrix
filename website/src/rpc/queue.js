'use strict'

define([
], (
) => {

  function Queue(drain) {

    let queue = []
    let lastDelay
    let timeoutId

    function scheduleDrain(delay) {
      if(queue.length === 0 || delay < lastDelay){
        clearTimeout(timeoutId)
        timeoutId = setTimeout(onDrain, delay)
        lastDelay = delay
      }
    }

    function schedule(rpcMessage, priority) {
      scheduleDrain(priority)
      queue.push(rpcMessage)
    }

    function onDrain() {
      drain(queue)
      queue = []
    }

    return {schedule}
  }

  return Queue
})