'use strict'

define([], () => {

  const ApiSymbol = Symbol('api')
  const ApiProtocol = Symbol('protocol')
  const ApiFunction = Symbol('function')
  const ApiProperty = Symbol('property')

  return {ApiSymbol, ApiProtocol, ApiFunction, ApiProperty}
})