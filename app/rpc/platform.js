'use strict'

requirejs.config({
  paths: {
    lodash: ['/lib/lodash']
  },
  config: {
    monitor: {
      debug: true
    }
  }
});

require(['message-rpc', 'remote-object', 'monitor'], (MessageRPC, RemoteObject, {ConsoleMonitor}) => {

  const platformApi = {
    add: (a, b) => a + b,
    div: (a, b) => {
      if (b === 0)
        throw 'division by zero error'

      return a / b
    },
  //   test: () => {
  //     return defineApi({f: a => a * a})
  //   }
  }

  // const platformApi = {
  //   myProperty: 10
  // }

  MessageRPC(platformApi, new Worker('app.js')/*, ConsoleMonitor('Platform')*/)//.then(appApi => {

    // appApi.initApp(RemoteObject(platformApi))
    //
    // setTimeout(() => {
    //   platformApi.myProperty.set(20)
    // }, 3000)
    //
    // setTimeout(() => {
    //   // console.log('platform, get 1 sec', platformApi.myProperty.get())
    // }, 1000)
    //
    // setTimeout(() => {
    //   // console.log('platform, get 5 sec', platformApi.myProperty.get())
    // }, 5000)
    //
    // setTimeout(() => {
    //   // console.log('platform, get 9 sec', platformApi.myProperty.get())
    // }, 9000)
  // })

})