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
  'serialization/json-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerMessenger},
  JsonSerializer
) => {

  const api = {
    imageSize: image => {
      return image.length
    }
  }

  MessageRPC(WebWorkerMessenger(self), JsonSerializer).then(rpc => {
    rpc.connect(RemoteApi(api))
  })
})
