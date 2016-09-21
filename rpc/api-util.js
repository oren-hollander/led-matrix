'use strict'

define([], () => {

  const ApiSymbol = Symbol('api')

  function defineApi(api) {
    api[ApiSymbol] = true
    return api
  }

  return {defineApi, ApiSymbol}
})