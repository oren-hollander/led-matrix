'use strict'

importScripts('/lib/require.js')

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    'lodash': ['/lib/lodash']
  },
  config: {
    'monitor': true
  }
});

require(['message-rpc', 'priority', 'monitor', 'remote-object'],
  (MessageRPC, {withPriority, setPriority, CallPriority, ReturnPriority, MessagePriorities}, {ConsoleMonitor}, RemoteObject) => {

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

    function ImageWidgetProxy(remoteImage) {

      let src

      const listener = newSrc => {
        src = newSrc
      }

      remoteImage.setSrcListener(RemoteObject(listener))

      return {
        getSrc: () => src,
        setSrc: newSrc => {
          src = newSrc
          remoteImage.setSrc(src)
        }
      }
    }

    MessageRPC({}, self, ConsoleMonitor('App'))
      .then(platformApi => platformApi.getImage())
      .then(remoteImage => {
        const image = ImageWidgetProxy(remoteImage)
        image.setSrc('post')
      })
  })




// platformApi.getImage()
    //   .then(img => img.getSrc()
    //     .then(src => {
    //       img.src = src
    //       return img
    //     }))
    //   .then(img => {
    //     const listener = newSrc => {
    //       img.src = newSrc
    //   }
    //   img.setSrcListener(RemoteObject(listener))
    //   img.setSrc('post')
    // })

    // platform.test().then(innerApi => {
    //   innerApi.f(4).then(print)
    // })
    // setPriority(platformApi, MessagePriorities.High)

    // const add = withPriority(platform.add, MessagePriorities.Immediate)
    // platform[CallPriority] = MessagePriorities.Immediate
    // platform[ReturnPriority] = MessagePriorities.Immediate
    // platformApi.add(1, 2).then(print).catch(error)
    // platformApi.add(3, 4).then(print).catch(error)
    // platformApi.add(5, 6).then(print).catch(error)
    // platformApi.add(7, 8).then(print).catch(error)

    // const div = withPriority(platform.div, MessagePriorities.Immediate, MessagePriorities.None)
    // div(1, 2).then(print).catch(error)
    // div(1, 0).then(print).catch(error)
    //
    // platform.div(1, 2).then(print).catch(error)
    // platform.div(1, 0).then(print).catch(error)
// })