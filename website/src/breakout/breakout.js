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
  'breakout/game',
  'serialization/json-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerChannelMessenger},
  Game,
  JsonSerializer
) => {

  let station

  const pads = []
  const gameApi = {
    setPad: pad => {
      pads.push(pad)
    },
    start: () => {
      Game.start(station, pads)
    },
    onPress: (padId, button) => {
      Game.onPress(padId, button)
    },
    onRelease: (padId, button) => {
      Game.onRelease(padId, button)
    }
  }

  WebWorkerChannelMessenger(self)
    .then(messenger => messenger.createChannel(1))
    .then(_.partial(MessageRPC, _, JsonSerializer))
    .then(rpc => {
      rpc.connect(RemoteApi(gameApi)).then(stationApi => {
        station = stationApi
      })
    })

})