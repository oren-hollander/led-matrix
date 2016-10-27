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
  'serialization/json-serializer',
  'util/relay'
], (
  _,
  MessageRpc,
  {RemoteApi},
  {WebSocketChannelMessenger},
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

  const uniqueStationId = () => ('00000' + Math.floor(Math.random() * 100000)).substr(-5, 5)
  // const uniqueStationId = () => '00000'

  function createRpcChannel(socket){
    WebSocketChannelMessenger(socket).then(messenger => {

      MessageRpc(messenger.createChannel(1), JsonSerializer).then(rpc => {

        function connectDevice(stationId, sourceChannelNumber)
        {
          const station = stations[stationId].api
          const stationMessenger = stations[stationId].messenger
          return station.createSignalingChannel().then(targetChannelNumber => {
            const sourceSignalingChannel = messenger.createChannel(sourceChannelNumber)
            const targetSignalingChannel = stationMessenger.createChannel(targetChannelNumber)
            Relay(sourceSignalingChannel, targetSignalingChannel)
            console.log('relaying...')
            return targetChannelNumber
          })
        }

        const serverApi = {
          registerStation: stationApi => {
            const stationId = uniqueStationId()
            stations[stationId] = {api: stationApi, messenger}
            return stationId
          },
          connectPad: (stationId, sourceChannelNumber) => {
            if(!stations[stationId]) {
              throw new Error(`Can't connect to station '${stationId}'`)
            }
            else {
              return connectDevice(stationId, sourceChannelNumber).then(channel =>
                stations[stationId].api.connectPad(channel)
              )
            }
          },
          connectScreen: (stationId, sourceChannelNumber) => {
            if(!stations[stationId]) {
              throw new Error(`Can't connect to station '${stationId}'`)
            }
            else {
              return connectDevice(stationId, sourceChannelNumber).then(channel =>
                stations[stationId].api.connectScreen(channel)
              )
            }
          }
        }

        console.log('connecting server api...')
        rpc.connect(RemoteApi(serverApi))
      })
    })
  }
})
