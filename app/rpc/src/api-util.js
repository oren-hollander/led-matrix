'use strict'

define([], () => {

  const ApiSymbol = Symbol('api')
  const PropertySymbol = Symbol('property')
  const SharedObjectSymbol = Symbol('shared-object')
  const FunctionSymbol = Symbol('function')
  const ProtocolSymbol = Symbol('protocol')

  return {ApiSymbol, FunctionSymbol, SharedObjectSymbol, PropertySymbol, ProtocolSymbol}
})