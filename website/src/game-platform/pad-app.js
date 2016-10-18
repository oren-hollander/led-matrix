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
  'game-platform/buttons'
], (
  _,
  {Canvas, setCanvasSize},
  DeviceIdScreen,
  PadScreen,
  JsonSerializer,
  RTCClient,
  RTCClientRemoteApi,
  MessageRPC,
  {RemoteApi, RemoteFunction},
  {WebSocketChannelMessenger, WebRTCChannel},
  Pad,
  Buttons
) => {

  if(!window.RTCPeerConnection)
    window.RTCPeerConnection = webkitRTCPeerConnection

  const peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]}

  const canvas = Canvas()
  setCanvasSize(canvas, 0.8 * window.innerWidth, 0.8 * window.innerHeight)

  const socket = new WebSocket(`ws://${window.location.host}`)
  socket.onopen = () => {
    createSignalingChannel('00000')
  }

  // DeviceIdScreen(canvas)
  //   .then(stationId => createSignalingChannel(stationId))

  // createSignalingChannel('00000')

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
    const buttons = Buttons()
    const pad = Pad(buttons)

    const padApi = {
      createButton: pad.createButton
    }

    rpc.connect(RemoteApi(padApi))
      .then(station => {
        pad.setStation(station)
        pad.buttonPressed('one')
        pad.buttonReleased('two')
      })

      // .then(pad => PadScreen(canvas, pad))
  }

  // const buttons = Buttons()
  // let stationApi
  //
  // function connect() {
  //   const socket = new WebSocket(`ws://${window.location.host}`)
  //
  //   socket.onclose = () => {
  //   }
  //
  //   socket.onopen = () => {
  //     start(socket)
  //   }
  // }
  //
  // connect()
  //
  // function start(socket){
  //   WebSocketChannelMessenger(socket).then(messenger => {
  //     const channel = messenger.createChannel(1)
  //     MessageRPC(channel, JsonSerializer).then(rpc => {
  //       Promise.all([
  //         rpc.connect(),
  //         getStationId()
  //       ]).then(([server, stationId]) => {
  //         return server.connectPad(stationId)
  //       }).then(padChannelNumber => {
  //         const padChannel = messenger.createChannel(padChannelNumber)
  //         MessageRPC(padChannel, JsonSerializer).then(rpc => {
  //           const padApi = {
  //             createButton: (name, x, y, r, color) => {
  //               buttons.add({name, x: x * canvas.width, y: y * canvas.height, r: r * canvas.width, pressed: false})
  //             }
  //           }
  //
  //           rpc.connect(RemoteApi(padApi)).then(api => {
  //             buttons.clear()
  //             stationApi = api
  //           })
  //         })
  //       }).catch(error => {
  //         console.log(error)
  //       })
  //     })
  //   })
  // }
  //
  // function getStationId() {
  //   // buttons.onRelease = () => {}
  //   // function pressButton(button) {
  //   //   if(!button.pressed) {
  //   //     button.pressed = true
  //   //     stationApi.buttonPressed(button.name)
  //   //   }
  //   // }
  //   //
  //   // function releaseButton(button) {
  //   //   if(button.pressed) {
  //   //     button.pressed = false
  //   //     stationApi.buttonReleased(button.name)
  //   //   }
  //   // }
  //
  //   const keypad = Keypad(buttons)
  //   // const codeInput = CodeInput(Rect(keypadX, keypadY - 200, keypadWidth, 200), 5)
  //   // const screen = Screen(Container(Rect(keypadX, keypadY - 200, keypadWidth, keypadHeight + 200), [keypad, codeInput]), canvas)
  //
  //   // const layout = bounds => {
  //   //
  //   //   const keypadHeight = bounds.h * 0.8
  //   //   const keypadWidth = keypadHeight * 0.75
  //   //   const keypadX = (bounds.w - keypadWidth) / 2
  //   //   const keypadY = (bounds.h - keypadHeight) / 2
  //   //
  //   //   return Rect(keypadX, keypadY, keypadWidth, keypadHeight)
  //   // }
  //
  //   screen.setOrientation('landscape')
  //   screen.setComponent(keypad)
  //
  //   const promise = createPromise()
  //   keypad.onCode = promise.resolve
  //   return promise
  // }
  //
  // let screen = FullScreenCanvas()
  // screen.onTouch = e => {
  //   const screenTouches = _.map(e.touches, touch => ({x: touch.pageX * window.devicePixelRatio, y: touch.pageY * window.devicePixelRatio}))
  //   buttons.updateTouches(screenTouches)
  // }
  //
  // // let canvas = screen.canvas
  //
  // // function paint() {
  //
  // // const ctx = canvas.getContext('2d')
  // // ctx.clearRect(0, 0,  canvasWidth, canvasHeight)
  // // _.forEach(buttons, button => {
  // //   ctx.fillStyle = button.color
  // //   ctx.beginPath()
  // //   ctx.arc(button.x, button.y, button.r, 0, Math.PI * 2)
  // //   ctx.fill()
  // // })
  //
  // // window.requestAnimationFrame(paint)
  // // }
  //
  // // window.requestAnimationFrame(paint)
})