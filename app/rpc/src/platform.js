'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['message-rpc', 'remote-object', 'monitor'], (MessageRPC, RemoteObject, {ConsoleMonitor}) => {

  // const platformApi = {
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

  // const platformApi = {
  //   myProperty: 10
  // }

  function ImageWidget(){

    let src = 'pre'
    let listener

    const remoteApi = {
      getSrc: () => src,
      setSrc: newSrc => {
        src = newSrc
      },
      setSrcListener: l => {
        listener = l
      }
    }

    const localApi = {
      getSrc: () => src,
      setSrc: newSrc => {
        src = newSrc
        if(listener)
          listener(src)
      }
    }
    return {remoteApi, localApi}
  }

  const image = ImageWidget()

  const platformApi = {
    getImage: () => RemoteObject(image.remoteApi)
  }

  MessageRPC(platformApi, new Worker('src/app.js')/*, ConsoleMonitor('Platform')*/).then(appApi => {
    console.log('before', image.localApi.getSrc())
    setTimeout(() => {
      console.log('after', image.localApi.getSrc())
    }, 2000)
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
  })
})