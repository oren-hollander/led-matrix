'use strict'

define(['api-util'], ({ApiSymbol}) => {

  function RemoteObject(object) {
    object[ApiSymbol] = true
    return object
  }

  return RemoteObject
})