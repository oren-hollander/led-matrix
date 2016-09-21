'use strict'

define([], () => {
  function Queue() {

    let queue = []

    function add(call) {
      queue.push(call)
    }

    function drain() {
      const q = queue
      queue = []
      return q
    }

    return {add, drain}
  }

  return Queue
})