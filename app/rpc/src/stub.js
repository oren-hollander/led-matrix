'use strict'

define(['id-gen'], (IdGenerator) => {
  function Stubs() {
    const idGen = IdGenerator()

    const stubs = {}

    function add(api, id) {
      if(id === undefined)
        id = idGen.uniqueId()
      stubs[id] = api
      return id
    }

    function get(id) {
      return stubs[id]
    }

    return {add, get}
  }

  return Stubs
})