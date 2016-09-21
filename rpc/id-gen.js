'use strict'

define([], () => {

  function IdGenerator(prefix) {
    let id = 0

    function uniqueId() {
      id++
      return `${prefix}_${id}`
    }

    return {uniqueId}
  }

  return IdGenerator
})