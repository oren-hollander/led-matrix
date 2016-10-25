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
  'game-platform/game-screen',
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
  GameScreen,
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

  const screens = Screens(canvas, {deviceIdScreen: DeviceIdScreen, gameScreen: GameScreen})

  const socket = new WebSocket(`ws://${window.location.host}`)
  socket.onopen = () => {
    WebSocketChannelMessenger(socket).then(messenger => {
      MessageRPC(messenger.createChannel(1), JsonSerializer)
        .then(rpc => Promise.all([rpc.connect(),  screens.show('deviceIdScreen')]))
        .then(([server, stationId]) => server.connectScreen(stationId, 2))
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

    let frameOps = []

    const screenApi = {
      color: color => {
        frameOps.push({op: 'color', color})
      },
      rect: rect => {
        frameOps.push({op: 'rect', rect})
      },
      circle: circle => {
        frameOps.push({op: 'circle', circle})
      },
      box: box => {
        frameOps.push({op: 'box', box})
      },
      text: (text, x, y) => frameOps.push({op: 'text', text, x, y}),
      paint: () => {
        screens.screen('gameScreen').paintFrame(frameOps)
        frameOps = []
      }
    }

    rpc.connect(RemoteApi(screenApi)).then(() => {
      screens.show('gameScreen')
    })
  }
})
