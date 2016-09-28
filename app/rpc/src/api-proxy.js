'use strict'

define(['lodash', 'priority', 'promise-util', 'id-gen', 'property', 'api-util'], (_, {CallPriority, ReturnPriority,
  MessagePriorities}, {createPromiseWithSettler}, IdGenerator, createProperty, {ProtocolSymbol}) => {

  const defaultPriorities = {
    [CallPriority]: MessagePriorities.High,
    [ReturnPriority]: MessagePriorities.High
  }

  const callIdGenerator = IdGenerator()

  function SharedObjectProxy(properties, stub, updateProperty) {
    const proxy = _.mapValues(properties, (propertyValue, propertyName) =>
      createProperty(propertyValue, newValue => {
        updateProperty(stub, propertyName, newValue, proxy[CallPriority])
      })
    )

    proxy[CallPriority] = MessagePriorities.High
    return proxy
  }

  function FunctionProxy(stub, callHandler) {

    const f = (...args) => {
      const {promise, resolve, reject} = createPromiseWithSettler()
      callHandler(callIdGenerator.uniqueId(), stub, args, f[CallPriority], f[ReturnPriority], {resolve, reject})
      return promise
    }

    return Object.assign(f, defaultPriorities)
  }

  function ApiProxy(functionNames, stub, callHandler) {

    function getPriority(func, prioritySymbol) {
      if(func[prioritySymbol])
        return func[prioritySymbol]
      return api[prioritySymbol]
    }

    const api =  _(functionNames)
      .map(functionName => {
        const func = (...args) => {
          const {promise, resolve, reject} = createPromiseWithSettler()
          const protocols = func[ProtocolSymbol]
          callHandler(callIdGenerator.uniqueId(), stub, functionName, args,
            getPriority(func, CallPriority), getPriority(func, ReturnPriority), {resolve, reject}, protocols)
          return promise
        }
        return [functionName, func]
      })
      .fromPairs()
      .value()

    return Object.assign(api, defaultPriorities)
  }

  return {ApiProxy, SharedObjectProxy, FunctionProxy}
})



