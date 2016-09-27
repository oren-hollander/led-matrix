'use strict'

requirejs.config({
  baseUrl: '/app/rpc/src',
  paths: {
    lodash: ['/lib/lodash']
  }
});

require(['message-rpc', 'remote-object', 'priority'], (MessageRPC, {RemoteApi}, {setPriority, MessagePriorities}) => {

  let appApi
  console.time()
  const platformApi = {
    back: count => {
      if(count <= 10000){
        console.log(count)
        appApi.forth(count + 1)
      }
      else {
        console.timeEnd()
      }
    }
  }

  MessageRPC(RemoteApi(platformApi), new Worker('speed-test-worker.js')).then(({api}) => {
    appApi = setPriority(api, MessagePriorities.Immediate)
    appApi.forth(1)
  })
})
