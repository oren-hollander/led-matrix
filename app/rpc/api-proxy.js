'use strict'

define(['priority', 'promise-util', 'id-gen', 'api-util'],
  ({CallPriority, ReturnPriority, MessagePriorities}, {createPromiseWithSettler}, IdGenerator, {ApiSymbol}) => {

  const idGen = IdGenerator()

  function ApiProxy(remoteApi, stub, callHandler) {
    const api = {
      [CallPriority]: MessagePriorities.Immediate,
      [ReturnPriority]: MessagePriorities.Immediate,
      [ApiSymbol]: true
    }

    function getPriority(func, prioritySymbol) {
      if(func[prioritySymbol])
        return func[prioritySymbol]
      return api[prioritySymbol]
    }

    return remoteApi.reduce((api, func) => {

      const apiFunction = (...args) => {
        const {promise, resolve, reject} = createPromiseWithSettler()
        callHandler(idGen.uniqueId(), stub, func, args, getPriority(apiFunction, CallPriority), getPriority(apiFunction, ReturnPriority), {resolve, reject})
        return promise
      }

      return Object.assign(api, {[func]: apiFunction})
    }, api)
  }

  return ApiProxy
})



