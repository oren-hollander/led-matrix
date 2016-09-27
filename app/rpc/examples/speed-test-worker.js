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
    forth: count => {
      platformApi.back(count)
    }
  }

  MessageRPC(RemoteApi(appApi), self).then(({api}) => {
    platformApi = setPriority(api, MessagePriorities.Immediate)
  })
})
