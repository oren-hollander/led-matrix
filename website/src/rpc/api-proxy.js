'use strict'

define([
  'lodash',
  'rpc/priority',
  'util/promise',
  'util/id-gen',
  'rpc/api-util'
], (
  _,
  {CallPriority, ReturnPriority,  MessagePriorities},
  {createPromiseWithSettler},
  IdGenerator,
  {SharedObjectSymbol, RefId}
) => {

  const defaultPriorities = {
    [CallPriority]: MessagePriorities.Immediate,
    [ReturnPriority]: MessagePriorities.Immediate
  }

  const callIdGenerator = IdGenerator()

  function SharedObjectProxy(properties, ref, updateProperty) {

    const nonTriggeringSetters = {}

    _.forEach(properties, (value, name) => {

      nonTriggeringSetters[name] = newValue => {
        value = newValue
      }

      Object.defineProperty(properties, name, {
        enumerable: true,
        configurable: false,
        get: () => value,
        set: newValue => {
          value = newValue
          if(properties[SharedObjectSymbol])
            updateProperty(ref, name, newValue, properties[CallPriority])
        },
      })
    })

    properties[SharedObjectSymbol] = {
      connected: false
    }

    properties[CallPriority] = MessagePriorities.Immediate
    properties[RefId] = ref
    return {proxy: properties, setters: nonTriggeringSetters}
  }

  function FunctionProxy(ref, callHandler) {

    const f = (...args) => {
      const {promise, resolve, reject} = createPromiseWithSettler()
      callHandler(callIdGenerator.uniqueId(), ref, args, f[CallPriority], f[ReturnPriority], {resolve, reject})
      return promise
    }

    return Object.assign(f, defaultPriorities, {[RefId]: ref})
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

    return Object.assign(api, defaultPriorities, {[RefId]: ref})
  }

  return {ApiProxy, FunctionProxy, SharedObjectProxy}
})



