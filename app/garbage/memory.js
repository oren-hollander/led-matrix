'use strict'

define(['../rpc/src/id-gen', './config'], (IdGenerator, {garbageCollectionTimeout, garbageCollectionPeriod}) => {

  const objects = {}

  const ObjectRecord = obj => ({obj, lastTouch: Date.now()})

  function addObject(id, obj) {
    console.log('memory.addObject', id)
    objects[id] = ObjectRecord(obj)
  }

  function touchObject(id) {
    if(objects[id]){
      console.log('memory.touchObject', id)
      objects[id].lastTouch = Date.now()
    }
    else {
      throw `Object ${id} not found!`
    }
  }

  function collectGarbage() {
    setTimeout(collectGarbage, garbageCollectionPeriod)
    const now = Date.now()

    Object.keys(objects).filter(key => objects[key].lastTouch + garbageCollectionTimeout < now).forEach(garbageKey => {
      console.log('memory.collectGarbage', garbageKey)
      delete objects[garbageKey]
    })
  }

  collectGarbage()

  return {addObject, touchObject}
})