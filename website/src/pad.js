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
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'rpc/monitor',
  'geometry/geometry',
  'serialization/json-serializer',
  'canvas/keyboard'
], (
  _,
  {FullScreenCanvas},
  MessageRPC,
  {RemoteApi},
  {WebSocketMessenger},
  {ConsoleMonitor},
  {pointInCircle, Rect},
  Serializer,
  {Keypad, CodeInput}
) => {

  const canvasWidth = 2400
  const canvasHeight = 1350

  const buttons = []
  let stationDeviceId
  let padDeviceId
  let serverApi
  let stationApi

  const padServerApi = {
    setDeviceId: deviceId => {
      padDeviceId = deviceId
      showConnectToStationUI()
    }
  }

  const padStationApi = {
    createButton: (name, x, y, r, color) => {
      buttons.push({name, x: x * canvasWidth, y: y * canvasHeight, r: r * canvasWidth, color, pressed: false})
    }
  }

  function connect() {
    const socket = new WebSocket(`ws://${window.location.host}`)

    // socket.onclose = () => {
    // }

    socket.onopen = () => {
      MessageRPC(RemoteApi(padServerApi), WebSocketMessenger(socket), Serializer, ConsoleMonitor('pad socket')).then(({api}) => {
        serverApi = api
      })
    }
  }

  // connect()

  function showConnectToStationUI(){
    document.getElementById('connect').addEventListener('click', connectToStation)
  }


  function pressButton(button) {
    if(!button.pressed) {
      button.pressed = true
      stationApi.buttonPressed(button.name)
    }
  }

  function releaseButton(button) {
    if(button.pressed) {
      button.pressed = false
      stationApi.buttonReleased(button.name)
    }
  }

  const handleTouch = e => {
    canvas.canvas.webkitRequestFullScreen()
    e.preventDefault()
    _.forEach(buttons, button => {
      const screenTouches = _.map(e.touches, touch => ({x: touch.pageX * window.devicePixelRatio, y: touch.pageY * window.devicePixelRatio}))
      if(_.some(screenTouches, touch => pointInCircle(touch, button)))
        pressButton(button)
      else
        releaseButton(button)
    })
  }

  function connectToStation(){
    if(padDeviceId){
      const stationDeviceId = document.getElementById('stationDeviceId').value
      serverApi.connectPad(stationDeviceId, RemoteApi(padStationApi)).then(api => {
        stationApi = api
        const panel = document.getElementById('connectPanel')
        panel.parentNode.removeChild(panel)
      })
    }
  }

  let canvas = FullScreenCanvas(canvasWidth, canvasHeight)
  canvas.addEventListener('touchstart', handleTouch, false)
  canvas.addEventListener('touchmove', handleTouch, false)
  canvas.addEventListener('touchcancel', handleTouch, false)
  canvas.addEventListener('touchend', handleTouch, false)

  const keypad = Keypad(canvas)
  const codeInput = CodeInput(canvas, 5)
  codeInput.add('1')
  codeInput.add('2')

  function paint() {

    const keypadHeight = canvas.height / 2
    const keypadWidth = keypadHeight * 3 / 4
    const keypadX = (canvas.width - keypadWidth) / 2
    const keypadY = (canvas.height - keypadHeight) / 2

    keypad.paint(Rect(keypadX, keypadY, keypadWidth, keypadHeight))
    codeInput.paint(Rect(keypadX, keypadY - 200, keypadWidth, 200))

    // const ctx = canvas.getContext('2d')
    // ctx.clearRect(0, 0,  canvasWidth, canvasHeight)
    // _.forEach(buttons, button => {
    //   ctx.fillStyle = button.color
    //   ctx.beginPath()
    //   ctx.arc(button.x, button.y, button.r, 0, Math.PI * 2)
    //   ctx.fill()
    // })

    window.requestAnimationFrame(paint)
  }

  window.requestAnimationFrame(paint)
})