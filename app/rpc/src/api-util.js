'use strict'

define([], () => {

  const ApiSymbol = Symbol('api')
  const PropertySymbol = Symbol('property')
  const SharedObjectSymbol = Symbol('shared-object')
  const FunctionSymbol = Symbol('function')

  return {ApiSymbol, FunctionSymbol, SharedObjectSymbol, PropertySymbol}
})