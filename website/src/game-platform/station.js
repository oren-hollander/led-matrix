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

  let remoteScreens = []

  function start(socket) {
    let nextSignalingChannel = 2

    WebSocketChannelMessenger(socket)
      .then(messenger => {

        const station = {
          createSignalingChannel: () => {
            return nextSignalingChannel++
          },
          connectPad: channelNumber => {
            MessageRPC(messenger.createChannel(channelNumber), JsonSerializer)
              .then(connectSignalingChannel)
              .then(connectToPad)
          },
          connectScreen: channelNumber => {
            MessageRPC(messenger.createChannel(channelNumber), JsonSerializer)
              .then(connectSignalingChannel)
              .then(connectToScreen)
          }
        }

        MessageRPC(messenger.createChannel(1), JsonSerializer)
          .then(rpc => rpc.connect())
          .then(server => server.registerStation(RemoteApi(station)))
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

      return rpc.connect(serverRemoteApi)
        .then(clientRemoteApi => RTCServer(clientRemoteApi, connection))
        .then(rtcChannel => MessageRPC(WebRTCChannel(rtcChannel), JsonSerializer))
    }

    function connectToScreen(rpc) {
     rpc.connect().then(screenApi => {
       remoteScreens.push(screenApi)
     })
    }

    function connectToPad(rpc) {
      const padInput = {
        onPress: undefined,
        onRelease: undefined
      }

      const stationApi = {
        onPress: (padId, button) => {
          if(padInput.onPress)
            padInput.onPress(padId, button)
        },
        onRelease: (padId, button) => {
          if(padInput.onRelease)
            padInput.onRelease(padId, button)
        }
      }

      rpc.connect(RemoteApi(stationApi)).then(pad => {
        pad.setPadId(state.pads.length)
          .then(pad.getBounds)
          .then(bounds => {
            const colors = padColors[state.pads.length]
            pad.setBackgroundColor(colors[0])
            state.pads.push({pad, bounds, input: padInput})
            if(state.pads.length === 2){
              _.forEach(state.pads, ({pad, bounds}, i) => {
                const size = Math.min(bounds.w, bounds.h)
                padInput.onRelease = (padId, button) => {
                  if(button === 'start' && state.pads.length >= 2){
                    padInput.onRelease = undefined
                    screens.screen('stationIdScreen').close()
                  }
                }

                pad.createButton('start', bounds.w / 2, bounds.h / 2, size * 0.35, padColors[i][4])
              })
            }
          })
      })
    }
  }

  function startGame() {

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

    remoteScreens.push(screenApi)

    WebWorkerChannelMessenger(new Worker('/src/breakout/breakout.js'))
      .then(messenger => messenger.createChannel(1))
      .then(_.partial(MessageRPC, _, JsonSerializer))
      .then(rpc => rpc.connect())
      .then(gameApi => {

        _.forEach(state.pads, ({input}) => {
          input.onPress = gameApi.onPress
          input.onRelease = gameApi.onRelease
        })

        _(state.pads)
          .map(({pad}) => RemoteApi(pad))
          .forEach(padApi => gameApi.setPad(padApi))

        gameApi.setScreen()
        _(remoteScreens).forEach(screen => {
          gameApi.setScreen(RemoteApi(screen))
        })

        gameApi.start()
      })
  }
})