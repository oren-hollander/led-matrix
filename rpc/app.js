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
    return a/ b
  }

  MessageRPC({}, self).then(platform => {
    platform.add[CallPriority] = MessagePriorities.Immediate
    platform.add[ReturnPriority] = MessagePriorities.Immediate

    platform.div[CallPriority] = MessagePriorities.Immediate
    platform.div[ReturnPriority] = MessagePriorities.Immediate

    platform.add(1, 2).then(print).catch(error)
    platform.div(1, 2).then(print).catch(error)
    platform.div(1, 0).then(print).catch(error)
  })
})