'use strict'

define(['lodash', 'api-util'], (_, {apiSymbols: {ApiSymbol, ApiProtocol, ApiFunction, ApiProperty}}) => {

  function RemoteObject(object) {
    object[ApiSymbol] = true
    return object
  }

  return RemoteObject
})