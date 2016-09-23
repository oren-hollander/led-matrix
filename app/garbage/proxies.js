'use strict'

define(['./config'], ({garbageCollectionPeriod}) => {

  function Proxies(touchHandler) {

    const touchQueue = new Set()

    function touchObjects() {
      console.log('proxy.touchObjects')
      setTimeout(touchObjects, garbageCollectionPeriod)
      for(let id of touchQueue){
        console.log('proxy.touchHandler', id)
        touchHandler(id)
      }
      touchQueue.clear()
    }

    touchObjects()

    function touchObject(id) {
      console.log('proxy.touchObject', id)
      touchQueue.add(id)
    }

    return {touchObject}
  }

  return Proxies
})