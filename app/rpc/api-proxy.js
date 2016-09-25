'use strict'

define(['lodash', 'priority', 'promise-util', 'id-gen'], (_, {CallPriority, ReturnPriority, MessagePriorities},
  {createPromiseWithSettler}, IdGenerator) => {

  const idGen = IdGenerator()

  function ApiProxy(functionNames, properties, stub, callHandler) {

    const api = {
      [CallPriority]: MessagePriorities.Immediate,
      [ReturnPriority]: MessagePriorities.Immediate
    }

    _.forOwn(properties, (propertyValue, propertyName) => {
      let v = propertyValue
      api[propertyName] = {
        get: () => v,
        set: (newValue) => {
          v = newValue
          callHandler.updateProperty(stub, propertyName, newValue)
        },
        _set: (newValue) => {
          v = newValue
        }
      }
    })

    function getPriority(func, prioritySymbol) {
      if(func[prioritySymbol])
        return func[prioritySymbol]
      return api[prioritySymbol]
    }

    return functionNames.reduce((api, func) => {

      const apiFunction = (...args) => {
        const {promise, resolve, reject} = createPromiseWithSettler()
        callHandler.makeCall(idGen.uniqueId(), stub, func, args,
          getPriority(apiFunction, CallPriority), getPriority(apiFunction, ReturnPriority), {resolve, reject})
        return promise
      }

      return Object.assign(api, {[func]: apiFunction})
    }, api)
  }

  return ApiProxy
})



