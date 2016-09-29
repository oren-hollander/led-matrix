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

require(['message-rpc', 'remote-object', 'shared-object-proxy'], (MessageRPC, {RemoteApi}, SharedObjectProxy) => {

  function print(message) {
    console.log(message)
  }

  function error(message) {
    console.log('error: ' + message)
  }

  let sharedObject
  const appApi = {
    setSharedObject: (so) => {
      sharedObject = SharedObjectProxy(so)
      console.log('app get x 0', sharedObject.x, 20)
    }
  }

  MessageRPC(RemoteApi(appApi), self).then(({api: platformApi}) => {
    platformApi.f().then(add => add(3, 4)).then(print)

    setTimeout(() => {
      console.log('app get x 2', sharedObject.x, 20)
    }, 4000)

    setTimeout(() => {
      console.log('app get x 4', sharedObject.x, 30)
    }, 8000)

    setTimeout(() => {
      sharedObject.x = 40
      console.log('app get x 5', sharedObject.x, 40)
    }, 10000)

    setTimeout(() => {
      console.log('app get x 6', sharedObject.x, 40)
    }, 12000)
  })
})