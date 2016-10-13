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
  'serialization/json-serializer',
  'game-platform/pad',
  'canvas/screen'
], (
  _,
  MessageRPC,
  {RemoteApi},
  {WebWorkerChnnelMessenger, WebSocketChannelMessenger},
  {RpcMonitor, ConsoleLogger},
  {FullScreenCanvas},
  JsonSerializer,
  Pad,
  Screen
) => {

  function connect() {
    const socket = new WebSocket(`ws://${window.location.host}`)

    socket.onmessage = message => {
      console.log('got message ', message.data)
    }

    socket.onclose = () => {
      console.log('socket closed')
    }

    socket.onopen = () => {
      start(socket)
    }
  }

  connect()
  const pads = []

  function start(socket) {

    WebSocketChannelMessenger(socket).then(messenger => {
      const channel = messenger.createChannel(1)
      MessageRPC(channel, JsonSerializer).then(rpc => {

        let nextPadChannel = 2
        const station = {
          createPadChannel: () => {
            return nextPadChannel++
          },
          connectPad: channelNumber => {
            const padChannel = messenger.createChannel(channelNumber)
            MessageRPC(padChannel, JsonSerializer).then(rpc => {
              const pad = Pad()
              rpc.connect(RemoteApi(pad)).then(padApi => {
                pad.createButton = padApi.createButton
                padConnected(pad)
              })
            })
          }
        }

        rpc.connect().then(server => {
          server.registerStation(RemoteApi(station)).then(stationId => {
            showStationId(stationId)
          })
        })
      })
    })
  }

  const canvas = FullScreenCanvas()
  const ctx = canvas.getContext('2d')

  let screen

  function padConnected(pad) {
    if(pads.length === 0) {
      screen.stop()
      screen = Screen(StationComp(pads), canvas)
      screen.start()
    }
    pads.push(pad)

    pad.onButtonRelease = buttonName => {
      console.log(`button release ${buttonName}`)
    }

    pad.createButton('abc', 0.5, 0.5, 0.3)
  }

  const StationComp = pads => ({
    shouldPaint: () => true,
    paint: ctx => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      _.forEach(pads, pad => {
        ctx.fillText('pad', canvas.width / 2, canvas.height / 2)
      })
    }
  })

  const StationIdComp = stationId => ({
    shouldPaint: () => true,
    paint: ctx => {
      ctx.font = '72px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = 'red'
      ctx.fillText(stationId, canvas.width / 2, canvas.height / 2)
    }
  })

  function showStationId(stationId){
    screen = Screen(StationIdComp(stationId), canvas)
    screen.start()
  }

  function startGame(){
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