'use strict'

define([
  'util/id-gen'
], (
  IdGenerator
) => {

  function RefMap() {
    const idGen = IdGenerator()

    const refs = new Map()

    function add(ref, refId = idGen.uniqueId()) {
      if(refs.has(refId))
        throw new Error(`RefMap already has a ref for id ${refId}`)

      refs.set(refId, ref)
      return refId
    }

    function get(refId) {
      return refs.get(refId)
    }

    function reserveRefId(){
      return idGen.uniqueId()
    }

    function release(refId){
      refs.delete(refId)
    }

    return {add, get, reserveRefId, release}
  }

  return RefMap
})