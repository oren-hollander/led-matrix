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

require(['message-rpc', 'remote-object', 'monitor'], (MessageRPC,
  {RemoteApi}, {ConsoleMonitor}) => {

  const appApi = {
    processImage: image => {
      // console.log('worker got the image')
    }
  }

  MessageRPC(RemoteApi(appApi), self, undefined/*ConsoleMonitor('worker')*/)
})
