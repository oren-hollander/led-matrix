'use strict'

importScripts('/src/lib/require.js')

requirejs.config({
  baseUrl: '/src',
  paths: {
    'lodash': ['lib/lodash']
  }
});

require([
  'lodash',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'serialization/binary-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerMessenger},
  BinarySerializer
) => {

  const api = {
    imageSize: image => {
      return image.length
    }
  }

  MessageRPC(RemoteApi(api), WebWorkerMessenger(self), BinarySerializer)
})
