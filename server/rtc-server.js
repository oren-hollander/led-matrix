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
  MessageRPC,
  {WebSocketChannelMessenger},
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

  const socketServer = new WebSocketServer({server: httpServer})

  socketServer.on('connection', socket => {
    socket.on('close', () => {
      console.log('socket closed')
    })

    connectSignalChannel(socket)
  })

  let firstConnectFunction
  let firstMessenger

  function connectSignalChannel(socket) {
    WebSocketChannelMessenger(socket).then(messenger => {
      MessageRPC(messenger.createChannel(1), JsonSerializer)
        .then(rpc => {
          rpc.connect().then(connectFunction => {
            if(!firstConnectFunction){
              firstConnectFunction = connectFunction
              firstMessenger = messenger
            }
            else {
              Relay(firstMessenger.createChannel(2), messenger.createChannel(2))
              firstConnectFunction(true)
              connectFunction(false)
              firstConnectFunction = undefined
              firstMessenger = undefined
            }
          }).catch(e => {
            console.log('connect error', e)
          })
        })
        .catch(e => {
          console.log('rpc error', e)
        })
    }).catch(e => {
      console.log('channel error', e)
    })
  }

})
