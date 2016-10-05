'use strict'

define([
  'util/id-gen'
], (
  IdGenerator
) => {

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

    function createId(){
      return idGen.uniqueId()
    }

    return {add, get, createId}
  }

  return Stubs
})