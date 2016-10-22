'use strict'

requirejs.config({
  baseUrl: '/src',
  paths: {
    lodash: ['lib/lodash']
  }
});

require([
  'lodash',
  'canvas/canvas',
  'game-platform/device-id-screen',
  'game-platform/pad-screen',
  'serialization/json-serializer',
  'rtc/rtc-client',
  'rtc/rtc-client-remote-api',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'game-platform/pad',
  'game-platform/buttons',
  'canvas/screens'
], (
  _,
  {Canvas, setCanvasSize},
  DeviceIdScreen,
  PadScreen,
  JsonSerializer,
  RTCClient,
  RTCClientRemoteApi,
  MessageRPC,
  {RemoteApi},
  {WebSocketChannelMessenger, WebRTCChannel},
  Pad,
  Buttons,
  Screens
) => {

  if(!window.RTCPeerConnection)
    window.RTCPeerConnection = webkitRTCPeerConnection

  const peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]}

  const canvas = Canvas()
  setCanvasSize(canvas, 0.8 * window.innerWidth, 0.8 * window.innerHeight)

  const socket = new WebSocket(`ws://${window.location.host}`)

  const screens = Screens(canvas, {deviceIdScreen: DeviceIdScreen, padScreen: PadScreen})
  screens.show('deviceIdScreen').then(deviceId => {
    createSignalingChannel(deviceId)
  })

  function createSignalingChannel(stationId) {

    WebSocketChannelMessenger(socket).then(messenger => {
      MessageRPC(messenger.createChannel(1), JsonSerializer)
        .then(rpc => rpc.connect())
        .then(server => server.connectToDevice(stationId, 2))
        .then(() => MessageRPC(messenger.createChannel(2), JsonSerializer))
        .then(connectSignalingChannel)
    })
  }

  function connectSignalingChannel(rpc) {
    const clientConnection = new RTCPeerConnection(peerConnectionConfig)
    const clientRemoteApi = RemoteApi(RTCClientRemoteApi(clientConnection))

    rpc.connect(clientRemoteApi)
      .then(serverRemoteApi => RTCClient(serverRemoteApi, clientConnection))
      .then(rtcChannel => MessageRPC(WebRTCChannel(rtcChannel), JsonSerializer))
      .then(connectToStation)
  }

  function connectToStation(rpc) {
    const padEvents = {}

    const padApi = {
      setBackgroundColor: color => padEvents.setBackgroundColor(color),
      createButton: (name, x, y, r, color) => padEvents.createButton(name, x, y, r, color),
      reset: () => padEvents.reset(),
      getBounds: () => padEvents.getBounds(),
      setPadId: padId => padEvents.setPadId(padId)
    }

    rpc.connect(RemoteApi(padApi))
      .then(stationApi => {
        screens.show('padScreen', stationApi, padEvents)
      })
  }
})