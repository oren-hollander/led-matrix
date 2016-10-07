'use strict'

requirejs.config({
  baseUrl: '/src',
  paths: {
    lodash: ['lib/lodash']
  }
});

require([
  'rpc/messenger',
  'rpc/message-rpc',
  'serialization/json-serializer',
  'rpc/monitor',
  'rpc/remote'
], (
  {WebSocketMessenger},
  MessageRPC,
  JsonSerializer,
  {ConsoleMonitor},
  {RemoteApi}
) => {

  let signalApi

  const clientApi = {
    connectDevice: relayId => {
      console.log('connect device', relayId)
      createRtcChannel(relayId)
    }
  }

  const rtcApi = {
    echo: message => {
      console.log(message)
    }
  }

  const signalSocket = new WebSocket(`ws://${window.location.host}`)
  signalSocket.onopen = () => {
    signalSocket.send(JSON.stringify({type: 'signal'}))
    MessageRPC(RemoteApi(clientApi), WebSocketMessenger(signalSocket), JsonSerializer).then(rpc => {
      signalApi = rpc.api
      signalApi.registerDevice().then(deviceId => {
        console.log('DeviceId', deviceId)
      })
    })
  }

  function createRtcChannel(relayId) {
    const rtcSocket = new WebSocket(`ws://${window.location.host}`)
    rtcSocket.onopen = () => {
      rtcSocket.send(JSON.stringify({type: 'rtc', relayId}))// wait for ack
      MessageRPC(RemoteApi(rtcApi), WebSocketMessenger(rtcSocket), JsonSerializer).then(({api}) => {
        api.echo('testing, 123...')
      })
    }
  }


  document.getElementById('connect').addEventListener('click', () => {
    const deviceId = document.getElementById('deviceId').value
    console.log('signalApi', signalApi)
    signalApi.connectDevice(deviceId).then(relayId => {
      console.log('relay id', relayId)
      createRtcChannel(relayId)
    })
  })

})