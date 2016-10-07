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
  'rpc/messenger',
  'rpc/remote',
  'util/relay',
  'serialization/json-serializer'
], (
  _,
  MessageRpc,
  {WebSocketMessenger},
  {RemoteApi},
  Relay,
  JsonSerializer
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

  const uniqueDeviceId = () => ('00000' + Math.floor(Math.random() * 100000)).substr(-5, 5)
  const socketServer = new WebSocketServer({server: httpServer})

  const deviceApis = {}
  const relaySockets = {}

  socketServer.on('connection', socket => {
    socket.on('close', () => {
      console.log('socket closed')
    })

    socket.on('message', strMessage => {
      console.log(`message: ${strMessage}`)
      const message = JSON.parse(strMessage)
      switch (message.type) {
        case 'signal':
          socket.on('message', () => {})
          connectSignalChannel(socket)
          break
        case 'rtc':
          socket.on('message', () => {})
          connectRtcChannel(socket, message.relayId)
          break
      }
    })


    function connectSignalChannel(socket) {
      let deviceApi

      const signalApi = {
        registerDevice: () => {
          const deviceId = uniqueDeviceId()
          console.log('-------- registerDevice --------')
          console.log('registering', deviceId)
          deviceApis[deviceId] = deviceApi
          console.log(deviceApis[deviceId])
          console.log('--------------------------------')
          return deviceId
        },
        connectDevice: targetDeviceId => {
          console.log('-------- connectDevice ---------')
          console.log('connect device', targetDeviceId)
          console.log(targetDeviceId)
          console.log(deviceApis[targetDeviceId])
          const relayId = uniqueDeviceId()
          deviceApis[targetDeviceId].connectDevice(relayId)
          console.log('--------------------------------')
          return relayId
        }
      }

      MessageRpc(RemoteApi(signalApi), WebSocketMessenger(socket), JsonSerializer).then(rpc => {
        deviceApi = rpc.api
      })
    }

    function connectRtcChannel(socket, relayId) {
      console.log('--------- connectRtcChannel --------------')
      if(relaySockets[relayId]){
        console.log('second socket', relayId)
        Relay(WebSocketMessenger(relaySockets[relayId]), WebSocketMessenger(socket))
        delete relaySockets[relayId]
      }
      else {
        console.log('first socket', relayId)
        relaySockets[relayId] = socket
      }
      console.log('--------------------------------')
    }
  })
})
