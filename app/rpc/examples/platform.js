'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['message-rpc', 'remote-object', 'monitor', 'shared-object-proxy'], (MessageRPC,
  {RemoteApi, RemoteFunction}, SharedObjectProxy) => {

  const platformApi = {
    f: () => {
      console.log('@platform')
      return RemoteFunction((a, b) => a + b)
    }
  }

  MessageRPC(RemoteApi(platformApi), new Worker('app.js')).then(({api: appApi, createSharedObject}) => {
    const so_ = createSharedObject({x: 10})
    const so = SharedObjectProxy(so_)
    console.log('platform get x 0:1', so.x, 10)
    so.x = 20
    console.log('platform get x 0:2', so.x, 20)
    appApi.setSharedObject(so_)

    setTimeout(() => {
      console.log('platform get x 2', so.x, 20)
    }, 4000)

    setTimeout(() => {
      so.x = 30
      console.log('platform get x 3', so.x, 30)
    }, 6000)

    setTimeout(() => {
      console.log('platform get x 4', so.x, 30)
    }, 8000)

    setTimeout(() => {
      console.log('platform get x 6', so.x, 40)
    }, 12000)
  })
})