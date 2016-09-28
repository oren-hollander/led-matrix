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

require(['message-rpc', 'remote-object', 'priority'], (MessageRPC, {RemoteApi}, {setPriority, MessagePriorities}) => {

  let platformApi

  const appApi = {
    forth: (count, image) => {
      platformApi.back(count, image)
      return image
    }
  }

  MessageRPC(RemoteApi(appApi), self).then(({api}) => {
    platformApi = setPriority(api, MessagePriorities.Immediate)
  })
})
