'use strict'

define([
  'lodash',
  'rpc/priority',
  'util/promise',
  'util/id-gen',
  'util/property'
], (
  _,
  {CallPriority, ReturnPriority,  MessagePriorities},
  {createPromiseWithSettler},
  IdGenerator, createProperty
) => {

  const defaultPriorities = {
    [CallPriority]: MessagePriorities.Immediate,
    [ReturnPriority]: MessagePriorities.Immediate
  }

  const callIdGenerator = IdGenerator()

  function SharedObjectProxy(properties, ref, updateProperty) {
    const proxy = _.mapValues(properties, (propertyValue, propertyName) =>
      createProperty(propertyValue, newValue => {
        updateProperty(ref, propertyName, newValue, proxy[CallPriority])
      })
    )

    proxy[CallPriority] = defaultPriorities[CallPriority]
    return proxy
  }

  function FunctionProxy(ref, callHandler) {

    const f = (...args) => {
      const {promise, resolve, reject} = createPromiseWithSettler()
      callHandler(callIdGenerator.uniqueId(), ref, args, f[CallPriority], f[ReturnPriority], {resolve, reject})
      return promise
    }

    return Object.assign(f, defaultPriorities)
  }

  function ApiProxy(functionNames, ref, callHandler) {

    function getPriority(func, prioritySymbol) {
      if(func[prioritySymbol])
        return func[prioritySymbol]
      return api[prioritySymbol]
    }

    const api =  _(functionNames)
      .map(functionName => {
        const func = (...args) => {
          const {promise, resolve, reject} = createPromiseWithSettler()
          callHandler(callIdGenerator.uniqueId(), ref, functionName, args,
            getPriority(func, CallPriority), getPriority(func, ReturnPriority), {resolve, reject})
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



