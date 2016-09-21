'use strict'

define(['id-gen'], (IdGenerator) => {
  const idGen = IdGenerator('stub')

  const stubs = {}

  function add(api) {
    const id = idGen.uniqueId()
    stubs[id] = api
    return id
  }

  function get(id) {
    return stubs[id]
  }

  return {add, get}
})