'use strict'

requirejs.config({
  baseUrl: '/src',
  paths: {
    lodash: ['lib/lodash']
  }
});

require([
  'lodash',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'canvas/canvas',
  'serialization/json-serializer',
  'canvas/screens',
  'game-platform/station-id-screen',
  'game-platform/game-screen',
  'rtc/rtc-server',
  'rtc/rtc-server-remote-api',
  'game-platform/colors'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerChannelMessenger, WebSocketChannelMessenger, WebRTCChannel},
  {Canvas, setCanvasSize},
  JsonSerializer,
  Screens,
  StationIdScreen,
  GameScreen,
  RTCServer,
  RTCServerRemoteApi,
  Colors
) => {

  if(!window.RTCPeerConnection)
    window.RTCPeerConnection = webkitRTCPeerConnection

  const peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]}

  function connect() {
    const socket = new WebSocket(`ws://${window.location.host}`)

    socket.onclose = () => {
      console.log('socket closed')
    }

    socket.onopen = () => {
      start(socket)
    }
  }

  connect()

  const canvas = Canvas()
  setCanvasSize(canvas, window.innerWidth, window.innerHeight)

  const screens = Screens(canvas, {stationIdScreen: StationIdScreen, gameScreen: GameScreen})
  const padColors = [
    Colors.primary,
    Colors.secondary1,
    Colors.secondary2,
    Colors.complement
  ]

  let state = {
    stationId: undefined,
    pads: [],
    colors: padColors
  }

  let frameOps = []

  function start(socket) {
    let nextSignalingChannel = 2

    WebSocketChannelMessenger(socket)
      .then(messenger => {

        const station = {
          createSignalingChannel: () => {
            return nextSignalingChannel++
          },
          connectDevice: channelNumber => {
            MessageRPC(messenger.createChannel(channelNumber), JsonSerializer)
              .then(connectSignalingChannel)
          }
        }

        MessageRPC(messenger.createChannel(1), JsonSerializer)
          .then(rpc => rpc.connect())
          .then(server => server.registerDevice(RemoteApi(station)))
          .then(stationId => {
            state.stationId = stationId
            return screens.show('stationIdScreen', state)
          })
          .then(() => {
            screens.show('gameScreen', state)
            startGame()
          })
      })

    function connectSignalingChannel(rpc) {
      const connection = new RTCPeerConnection(peerConnectionConfig)
      const serverRemoteApi = RemoteApi(RTCServerRemoteApi(connection))

      rpc.connect(serverRemoteApi)
        .then(clientRemoteApi => RTCServer(clientRemoteApi, connection))
        .then(rtcChannel => MessageRPC(WebRTCChannel(rtcChannel), JsonSerializer))
        .then(connectToPad)
    }

    function connectToPad(rpc) {
      const stationApi = {
        onPress: (padId, button) => {},
        onRelease: (padId, button) => {
          if(button === 'start' && state.pads.length >= 2){
            screens.screen('stationIdScreen').close()
          }
        }
      }

      rpc.connect(RemoteApi(stationApi)).then(pad => {
        if(state.pads.length < 4){
          pad.setPadId(state.pads.length)
            .then(pad.getBounds)
            .then(bounds => {
              const colors = padColors[state.pads.length]
              pad.setBackgroundColor(colors[0])
              state.pads.push({pad, bounds})
              if(state.pads.length === 2){
                _.forEach(state.pads, ({pad, bounds}, i) => {
                  const size = Math.min(bounds.w, bounds.h)
                  pad.createButton('start', bounds.w / 2, bounds.h / 2, size * 0.35, padColors[i][4])
                })
              }
            })
        }
      })
    }
  }

  function startGame() {

    WebWorkerChannelMessenger(new Worker('/src/breakout/breakout.js'))
      .then(messenger => messenger.createChannel(1))
      .then(_.partial(MessageRPC, _, JsonSerializer))
      .then(rpc => {
        const stationApi = {
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
            screens.screen('gameScreen').paintReady(frameOps)
            frameOps = []
          }
        }

        rpc.connect(RemoteApi(stationApi)).then(gameApi => {
          _(state.pads)
            .map(({pad}) => RemoteApi(pad))
              .forEach(padApi => gameApi.setPad(padApi))
          gameApi.start()
        })
      })
  }
})