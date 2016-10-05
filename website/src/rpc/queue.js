'use strict'

define([
  'rpc/priority'
], (
  {MessagePriorities}
) => {

  function priorityDelay(priority) {
    switch (priority) {
      case MessagePriorities.High:
        return 0
      case MessagePriorities.Medium:
        return 1000 / 60
      case MessagePriorities.Low:
        return 1000 / 25
      default:
        throw `Unknown priority ${priority}`
    }
  }

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

    function add(rpcMessage, priority) {
      scheduleDrain(priorityDelay(priority))
      queue.push(rpcMessage)
    }

    function onDrain() {
      drain(queue)
      queue = []
    }

    return {add}
  }

  return Queue
})