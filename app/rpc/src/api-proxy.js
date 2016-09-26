'use strict'

define(['lodash', 'priority', 'promise-util', 'id-gen', 'property'],
  (_, {CallPriority, ReturnPriority, MessagePriorities}, {createPromiseWithSettler}, IdGenerator, createProperty) => {

  const idGen = IdGenerator()

  function ApiProxy(functionNames, properties, stub, callHandler) {

    const api = {
      [CallPriority]: MessagePriorities.High,
      [ReturnPriority]: MessagePriorities.High
    }

    _.forOwn(properties, (propertyValue, propertyName) => {
      createProperty(api, propertyName, propertyValue, newValue => {
        callHandler.updateProperty(stub, propertyName, newValue)
      })
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



