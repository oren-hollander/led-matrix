'use strict'

importScripts('/lib/require.js')

requirejs.config({
  paths: {
    'lodash': ['/lib/lodash']
  },
  config: {
    'monitor': true
  }
});

require(['message-rpc', 'priority', 'monitor'], (MessageRPC, {withPriority, setPriority, CallPriority, ReturnPriority, MessagePriorities}, {ConsoleMonitor}) => {

  function print(message) {
    console.log(message)
  }

  function error(message) {
    console.log('error: ' + message)
  }

  // function div(a, b) {
  //   if (b === 0)
  //     throw 'div by zero'
  //   return a / b
  // }
  //
  // const appApi = {
  //   initApp: platformApi => {
  //
  //     // console.log('app, get', platformApi.myProperty.get())
  //
  //     setTimeout(() => {
  //       platformApi.myProperty.set(30)
  //     }, 7000)
  //
  //     setTimeout(() => {
  //       console.log('app, get 1 sec', platformApi.myProperty.get())
  //     }, 1000)
  //
  //     setTimeout(() => {
  //       console.log('app, get 5 sec', platformApi.myProperty.get())
  //     }, 5000)
  //
  //     setTimeout(() => {
  //       console.log('app, get 9 sec', platformApi.myProperty.get())
  //     }, 9000)
  //   }
  // }

  MessageRPC({}, self, ConsoleMonitor('App')).then(platformApi => {
    // platform.test().then(innerApi => {
    //   innerApi.f(4).then(print)
    // })
    setPriority(platformApi, MessagePriorities.High)

    // const add = withPriority(platform.add, MessagePriorities.Immediate)
    // platform[CallPriority] = MessagePriorities.Immediate
    // platform[ReturnPriority] = MessagePriorities.Immediate
    platformApi.add(1, 2).then(print).catch(error)
    platformApi.add(3, 4).then(print).catch(error)
    platformApi.add(5, 6).then(print).catch(error)
    platformApi.add(7, 8).then(print).catch(error)

    // const div = withPriority(platform.div, MessagePriorities.Immediate, MessagePriorities.None)
    // div(1, 2).then(print).catch(error)
    // div(1, 0).then(print).catch(error)
    //
    // platform.div(1, 2).then(print).catch(error)
    // platform.div(1, 0).then(print).catch(error)
  })
})