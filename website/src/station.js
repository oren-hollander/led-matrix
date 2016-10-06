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
  'rpc/monitor',
  'canvas/canvas',
  'util/promise',
  'serialization/json-serializer'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerMessenger, WebSocketMessenger},
  {ConsoleMonitor},
  {FullScreenCanvas},
  {createPromiseWithSettler},
  Serializer
) => {

  let stationDeviceId
  const pads = []
  const padResolvers = []

  const stationServerApi = {
    setDeviceId: deviceId => {
      stationDeviceId = deviceId
      showStationDeviceId()
    },
    connectPad: padApi => {
      pads.push(RemoteApi(padApi))
      const {promise, resolve} = createPromiseWithSettler()
      padResolvers.push(resolve)
      if(pads.length === 2){
        startGame()
      }

      return promise.then(api => RemoteApi(api))
    }
  }

  function connect() {
    const socket = new WebSocket(`ws://${window.location.host}`)

    socket.onmessage = message => {
      console.log('got message ', message.data)
    }

    socket.onclose = () => {
      console.log('socket closed')
    }

    socket.onopen = () => {
      MessageRPC(RemoteApi(stationServerApi), WebSocketMessenger(socket), Serializer, ConsoleMonitor('station socket'))
    }
  }

  connect()

  let breakoutApi
  let frameOps = []

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
    text: (text, x, y) => frameOps.push({op: 'text', text, x, y})
  }

  const canvasWidth = 2400
  const canvasHeight = 1350

  const canvas = FullScreenCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.context

  function showStationDeviceId(){
    ctx.font = '72px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'red'
    ctx.fillText(stationDeviceId, canvasWidth / 2, canvasHeight / 2)
  }

  function startGame(){
    MessageRPC(RemoteApi(stationApi), WebWorkerMessenger(new Worker('/src/breakout/breakout.js')), Serializer).then(({api}) => {
      breakoutApi = api

      padResolvers[0](breakoutApi.connectPad(pads[0]))
      padResolvers[1](breakoutApi.connectPad(pads[1]))

      function paint() {
        if(frameOps.length > 0) {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight)
          _.forEach(frameOps, op => {
            switch (op.op) {
              case 'color':
                ctx.fillStyle = op.color
                break
              case 'rect':
                ctx.fillRect(op.rect.x, op.rect.y, op.rect.w, op.rect.h)
                break
              case 'box':
                ctx.fillRect(op.box.x - op.box.hw, op.box.y - op.box.hh, op.box.hw * 2, op.box.hh * 2)
                break
              case 'circle':
                ctx.beginPath()
                ctx.arc(op.circle.x, op.circle.y, op.circle.r, 0, Math.PI * 2)
                ctx.fill()
                break
              case 'text':
                ctx.textAlign = 'center'
                ctx.font = '72px sans-serif'
                ctx.fillText(op.text, op.x, op.y)
            }
          })
          frameOps = []
        }
        window.requestAnimationFrame(paint)
      }

      window.requestAnimationFrame(paint)

      breakoutApi.onReady()
    })


    // function buttonMouseDown() {
    //   serverConnection.send('hello')
    // }
    //
    // function gotMessageFromServer(message) {
    //   console.log('received', message.data, count++)
    // }

    // function startup() {
    //   var el = document.getElementsByTagName("canvas")[0];
    //   el.addEventListener("touchstart", handleStart, false);
    //   // el.addEventListener("touchend", handleEnd, false);
    //   // el.addEventListener("touchcancel", handleCancel, false);
    //   // el.addEventListener("touchmove", handleMove, false);
    // }
    //
    // function handleStart(evt) {
    //   evt.preventDefault();
    //   serverConnection.send('touch' + (count++))
    //
    // }
  }

})