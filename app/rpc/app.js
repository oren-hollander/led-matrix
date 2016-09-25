'use strict'

importScripts('/lib/require.js')

require.config({
  paths: {
    'lodash': ['/lib/lodash']
  }
})

require(['message-rpc', 'priority'], (MessageRPC, {CallPriority, ReturnPriority, MessagePriorities}) => {

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

  const appApi = {
    initApp: platformApi => {

      // console.log('app, get', platformApi.myProperty.get())

      setTimeout(() => {
        platformApi.myProperty.set(30)
      }, 7000)

      setTimeout(() => {
        console.log('app, get 1 sec', platformApi.myProperty.get())
      }, 1000)

      setTimeout(() => {
        console.log('app, get 5 sec', platformApi.myProperty.get())
      }, 5000)

      setTimeout(() => {
        console.log('app, get 9 sec', platformApi.myProperty.get())
      }, 9000)
    }
  }

  MessageRPC(appApi, self)
    // .then(platform => {
    // platform.test().then(innerApi => {
    //   innerApi.f(4).then(print)
    // })
    // platform.add[CallPriority] = MessagePriorities.Immediate
    // platform.add[ReturnPriority] = MessagePriorities.Immediate
    // platform.div[CallPriority] = MessagePriorities.Immediate
    // platform.div[ReturnPriority] = MessagePriorities.Immediate

    // const add = withPriority(platform.add, MessagePriorities.Immediate)
    // platform[CallPriority] = MessagePriorities.Immediate
    // platform[ReturnPriority] = MessagePriorities.Immediate
    // platform.add(1, 2).then(print).catch(error)
    // platform.add(3, 4).then(print).catch(error)

    // const div = withPriority(platform.div, MessagePriorities.Immediate, MessagePriorities.None)
    // div(1, 2).then(print).catch(error)
    // div(1, 0).then(print).catch(error)
    //
    // platform.div(1, 2).then(print).catch(error)
    // platform.div(1, 0).then(print).catch(error)
  // })
})