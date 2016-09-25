'use strict'

require.config({
  paths: {
    'lodash': ['/lib/lodash']
  }
})

require(['message-rpc', 'remote-object'], (MessageRPC, RemoteObject) => {

  // const api = {
  //   add: (a, b) => a + b,
  //   div: (a, b) => {
  //     if (b === 0)
  //       throw 'division by zero error'
  //
  //     return a / b
  //   },
  //   test: () => {
  //     return defineApi({f: a => a * a})
  //   }
  // }

  const platformApi = {
    myProperty: 10
  }

  MessageRPC({}, new Worker('app.js')).then(appApi => {

    appApi.initApp(RemoteObject(platformApi))

    setTimeout(() => {
      platformApi.myProperty.set(20)
    }, 3000)

    setTimeout(() => {
      console.log('platform, get 1 sec', platformApi.myProperty.get())
    }, 1000)

    setTimeout(() => {
      console.log('platform, get 5 sec', platformApi.myProperty.get())
    }, 5000)

    setTimeout(() => {
      console.log('platform, get 9 sec', platformApi.myProperty.get())
    }, 9000)
  })

})