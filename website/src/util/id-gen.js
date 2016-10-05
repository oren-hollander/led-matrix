'use strict'

define([], () => {

  function IdGenerator() {
    let id = 0

    function uniqueId() {
      id++
      return id
    }

    return {uniqueId}
  }

  return IdGenerator
})