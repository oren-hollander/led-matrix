'use strict'

define(['priority', 'promise-util'], ({CallPriority, ReturnPriority, MessagePriorities}, {createPromiseWithSettler}) => {

  let callId = 0

  function nextCallId() {
    callId++
    return callId
  }

  function ApiProxy(remoteApi, callHandler) {
    // const handler = {
    //   get: (target, name) => {
    //     if(name === CallPriority || name === ReturnPriority) {
    //       return target[name]
    //     }
    //     if(name === 'then')
    //       return
    //
    //     return (...args) => {
    //       const {promise, resolve, reject} = createPromiseWithSettler()
    //       callHandler(nextCallId(), name, args, target[CallPriority], target[ReturnPriority], {resolve, reject})
    //       return promise
    //     }
    //   },
    //   set: (target, property, value) => {
    //     if(property === CallPriority || property === ReturnPriority)
    //       target[property] = value
    //     return true
    //   }
    // }

    // const proxy = new Proxy({}, handler)
    // proxy[CallPriority] = MessagePriorities.Medium
    // proxy[ReturnPriority] = MessagePriorities.Medium
    return remoteApi.reduce((api, func) => {

      const apiFunction = (...args) => {
        const {promise, resolve, reject} = createPromiseWithSettler()
        callHandler(nextCallId(), func, args, apiFunction[CallPriority], apiFunction[ReturnPriority], {resolve, reject})
        return promise
      }

      apiFunction[CallPriority] = MessagePriorities.Medium
      apiFunction[ReturnPriority] = MessagePriorities.Medium

      return Object.assign(api, {[func]: apiFunction})
    }, {})
  }

  return ApiProxy
})



