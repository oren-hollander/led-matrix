'use strict'

define(['priority', 'promise-util'], ({CallPriority, ReturnPriority, MessagePriorities}, {createPromiseWithSettler}) => {

  let callId = 0

  function nextCallId() {
    callId++
    return callId
  }

  function ApiProxy(remoteApi, callHandler) {
    const api = {}
    api[CallPriority] = MessagePriorities.Medium
    api[ReturnPriority] = MessagePriorities.Medium

    function getPriority(func, prioritySymbol) {
      if(func[prioritySymbol])
        return func[prioritySymbol]
      return api[prioritySymbol]
    }

    return remoteApi.reduce((api, func) => {

      const apiFunction = (...args) => {
        const {promise, resolve, reject} = createPromiseWithSettler()
        callHandler(nextCallId(), func, args, getPriority(apiFunction, CallPriority), getPriority(apiFunction, ReturnPriority), {resolve, reject})
        return promise
      }

      return Object.assign(api, {[func]: apiFunction})
    }, api)
  }

  return ApiProxy
})



