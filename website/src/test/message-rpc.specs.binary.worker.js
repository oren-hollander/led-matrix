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
  {WebWorkerMessenger},
  BinarySerializer,
  ImageSerializer
) => {

  const api = {
    imageSize: image => {
      return image.length
    }
  }

  MessageRPC(RemoteApi(api), WebWorkerMessenger(self), BinarySerializer({Image: ImageSerializer}))
})
