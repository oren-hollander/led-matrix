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
  'rpc/monitor'
], (
  _,
  MessageRpc,
  {RemoteApi},
  {WebSocketMessenger},
  {ConsoleMonitor}
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

  // let stationApi
  // let padApis = []
  let devices = []

  const uniqueDeviceId = () => ('00000' + Math.floor(Math.random() * 100000)).substr(-5, 5)

    // let deviceId
    // do {
    //   deviceId = crypto.randomBytes(20).toString('oct')
    // }
    // while (devices[deviceId])
    // return deviceId


  const serverApi = {
    connectPad: (stationDeviceId, padApi) => {
      if(devices[stationDeviceId]) {
        return devices[stationDeviceId].connectPad(RemoteApi(padApi)).then(api => RemoteApi(api))
        // console.log('API keys', api)
        // console.log(_.keys(api).join())
        // return RemoteApi(api)
        // return devices[stationDeviceId]
      }
      else {
        throw `can't find station '${stationDeviceId}'`
      }
    }
    // ,
    // createButton: () => {},
    // buttonPressed: () => {},
    // b
  }

  function createRpcChannel(socket){
    MessageRpc(RemoteApi(serverApi), WebSocketMessenger(socket), ConsoleMonitor('server')).then(({api: device}) => {
      // if(stationApi && padApis.length === 2){
      //   console.log('Resetting connections')
      //   stationApi = undefined
      //   padApis = []
      // }

      const deviceId = uniqueDeviceId()
      devices[deviceId] = RemoteApi(device)
      device.setDeviceId(deviceId)

      // device.getType().then(type => {
      //   console.log(`${name} connected`)
      //
      //   if(type === 'station'){
      //     stationApi = RemoteApi(api)
      //   }
      //   else if (name === 'pad') {
      //     padApis.push(RemoteApi(api))
      //   }
      //
      //   if(stationApi && padApis.length === 2){
      //     console.log('server is connected to all')
      //     stationApi.connect(padApis[0], padApis[1])
      //     padApis[0].connect(stationApi)
      //     padApis[1].connect(stationApi)
      //   }
      // })
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