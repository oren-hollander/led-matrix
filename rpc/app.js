'use strict'

importScripts('/require.js')

require(['message-rpc', 'priority', 'api-proxy'], (MessageRPC, {CallPriority, ReturnPriority, MessagePriorities}, ApiProxy) => {

  function print(message) {
    console.log(message)
  }

  function error(message) {
    console.log('error: ' + message)
  }

  function div(a, b) {
    if (b === 0)
      throw 'div by zero'
    return a / b
  }

  const withPriority = (func, callPriority, returnPriority = callPriority) => (... args) => {
    const currentCallPriority = func[CallPriority]
    const currentRturnPriority = func[ReturnPriority]

    func[CallPriority] = callPriority
    func[ReturnPriority] = returnPriority

    const result = func(...args)

    func[CallPriority] = currentCallPriority
    func[ReturnPriority] = currentRturnPriority

    return result
  }

  MessageRPC({}, self).then(platform => {
    // platform.add[CallPriority] = MessagePriorities.Immediate
    // platform.add[ReturnPriority] = MessagePriorities.Immediate
    // platform.div[CallPriority] = MessagePriorities.Immediate
    // platform.div[ReturnPriority] = MessagePriorities.Immediate

    // const add = withPriority(platform.add, MessagePriorities.Immediate)
    platform[CallPriority] = MessagePriorities.Immediate
    platform[ReturnPriority] = MessagePriorities.Immediate
    platform.add(1, 2).then(print).catch(error)

    // const div = withPriority(platform.div, MessagePriorities.Immediate, MessagePriorities.None)
    // div(1, 2).then(print).catch(error)
    // div(1, 0).then(print).catch(error)
    //
    // platform.div(1, 2).then(print).catch(error)
    // platform.div(1, 0).then(print).catch(error)
  })
})