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
  'serialization/binary-serializer',
  'test/message-rpc.specs.image-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerChannelMessenger},
  {BinaryMultiBufferSerializer},
  ImageSerializer
) => {

  WebWorkerChannelMessenger(self).then(messenger => {
    const channel = messenger.createChannel(1)
    MessageRPC(channel, BinaryMultiBufferSerializer({Image: ImageSerializer})).then(rpc => {
      const api = {
        imageSize: image => {
          return image.length
        }
      }
      rpc.connect(RemoteApi(api))
    })
  })
})
