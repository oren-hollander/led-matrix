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
  'serialization/native-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerChannelMessenger},
  NativeSerializer
) => {

  const api = {
    imageSize: image => {
      return image.length
    }
  }

  WebWorkerChannelMessenger(self).then(messenger => {
    const channel = messenger.createChannel(1)
    MessageRPC(channel, NativeSerializer).then(rpc => {
      rpc.connect(RemoteApi(api))
    })
  })
})
