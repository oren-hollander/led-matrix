'use strict'

importScripts('../lib/require.js')

requirejs.config({
  baseUrl: '../',
  paths: {
    'lodash': ['lib/lodash']
  }
});

require([
  'lodash',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'serialization/json-serializer',
  'rpc/monitor'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerChannelMessenger},
  JsonSerializer,
  {RpcMonitor, ConsoleLogger, RemoteLogger}
) => {

  const api = {
    imageSize: image => {
      return image.length
    }
  }

  WebWorkerChannelMessenger(self).then(messenger => {
    const channel = messenger.createChannel(1)
    const debugChannel = messenger.createChannel(2)
    MessageRPC(channel, JsonSerializer, RpcMonitor('Worker', RemoteLogger(debugChannel))).then(rpc => {
      rpc.connect(RemoteApi(api))
    })
  })
})
