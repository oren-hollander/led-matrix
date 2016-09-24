'use strict'

define([], () => {

  const ApiSymbol = Symbol('api')
  const ApiProtocol = Symbol('protocol')

  function defineApi(api, protocol) {
    api[ApiSymbol] = true

    if(protocol)
      api[ApiProtocol] = protocol
    return api
  }

  return {defineApi, ApiSymbol}
})