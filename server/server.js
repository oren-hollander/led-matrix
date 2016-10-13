'use strict'

var WebSocketServer = require('ws').Server

const http = require('http')
const fs = require('fs')
const path = require('path')
var crypto = require("crypto");
var requirejs = require('requirejs');

requirejs.config({
  baseUrl: '../website/src',
  paths: {
    lodash: ['lib/lodash']
  },
  nodeRequire: require
})

requirejs([
  'lodash',
  'rpc/message-rpc',
  'rpc/remote',
  'rpc/messenger',
  'rpc/monitor',
  'serialization/json-serializer',
  'util/relay'
], (
  _,
  MessageRpc,
  {RemoteApi},
  {WebSocketChannelMessenger},
  {RpcMonitor, NodeConsoleLogger},
  JsonSerializer,
  Relay
) => {

  //////////////////////////////////////
  // HTTP
  //////////////////////////////////////

  console.log('Starting HTTP server...')

  const httpServer = http.createServer((request, response) => {
    const url = request.url === '/' ? '/index.html' : request.url
    var filePath = '../website' + url
    if (filePath == '../website/')
      filePath = '../website/index.html'

    const extName = path.extname(filePath)
    var contentType = 'text/html'
    switch (extName) {
      case '.js':
        contentType = 'text/javascript'
        break
      case '.css':
        contentType = 'text/css'
        break
      case '.json':
        contentType = 'application/json'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.jpg':
        contentType = 'image/jpg'
        break
      case '.wav':
        contentType = 'audio/wav'
        break
    }

    fs.readFile(filePath, function(error, content) {
      if (error) {
        if(error.code == 'ENOENT'){
          console.error(`Missing file: ${filePath}`)
          fs.readFile('./404.html', function(error, content) {
            response.writeHead(200, { 'Content-Type': contentType })
            response.end(content, 'utf-8')
          })
        }
        else {
          response.writeHead(500)
          response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n')
        }
      }
      else {
        response.writeHead(200, { 'Content-Type': contentType })
        response.end(content, 'utf-8')
      }
    })
  }).listen(8080)

  //////////////////////////////////////
  // Web Socket
  //////////////////////////////////////

  console.log('Starting WebSocket server')

  const socketServer = new WebSocketServer({server: httpServer})

  socketServer.on('connection', function(socket) {
    console.log('socket connected')
    createRpcChannel(socket)

    socket.on('close', () => {
      console.log('socket closed')
    })
  })

  let stations = {}

  const uniqueDeviceId = () => ('00000' + Math.floor(Math.random() * 100000)).substr(-5, 5)

  function createRpcChannel(socket){
    WebSocketChannelMessenger(socket).then(messenger => {
      const channel = messenger.createChannel(1)
      MessageRpc(channel, JsonSerializer, RpcMonitor('server', NodeConsoleLogger())).then(rpc => {

        const serverApi = {
          registerStation: station => {
            const stationId = uniqueDeviceId()
            stations[stationId] = {api: station, messenger}
            return stationId
          },
          connectPad: stationId => {
            if(!stations[stationId]) {
              throw new Error(`Can't connect to station '${stationId}'`)
            }
            else {
              return stations[stationId].api.createPadChannel().then(padChannelNumber => {
                const padChannel = messenger.createChannel(padChannelNumber)
                const stationChannel = stations[stationId].messenger.createChannel(padChannelNumber)
                Relay(padChannel, stationChannel)
                stations[stationId].api.connectPad(padChannelNumber)
                return padChannelNumber
              })
            }
          }
        }

        rpc.connect(RemoteApi(serverApi))
      })
    })
  }
})

/*

  0. devices setup rpc channel with server
  1. server calls device.getType(), devices return their type
  1. station & pads call server.registerDevice(), receives device id, each on its own time
  2. station shows its device id on screen, to let player enter it in pad
  3. pad shows station device id entry ui
  4. pad calls server.connectPad(padDeviceId, stationDeviceId)
  5. server calls station.connectPad(padApi) // pad api

*/