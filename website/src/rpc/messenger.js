'use strict'

define([
  'lodash',
  'util/promise'
], (
  _,
  {createPromiseWithSettler}
) => {

  function WebWorkerChannelMessenger(worker) {

    const {promise, resolve} = createPromiseWithSettler()

    let receivers = []
    let initialized = false

    worker.onmessage = ({data}) => {
      if(data.channel === 0) {
        switch(data.message){
          case 'init':
            worker.postMessage({channel: 0, message: 'init-ack'})
          case 'init-ack':
            if(!initialized){
              initialized = true
              resolve({createChannel})
            }
        }
      }
      else {
        const receiver = receivers[data.channel]
        if(receiver)
          receiver(data.message)
      }
    }

    worker.postMessage({channel: 0, message: 'init'})

    function createChannel(channel) {
      if(channel < 1){
        throw new Error('channel must be a positive integer')
      }

      return {
        send: message => {
          if(message instanceof ArrayBuffer){
            worker.postMessage({channel, message}, [message])
          }
          else if (_.isArray(message) && _.every(message, m => m instanceof ArrayBuffer)){
            worker.postMessage({channel, message}, message)
          }
          else {
            worker.postMessage({channel, message})
          }
        },
        setReceiver: callback => {
          receivers[channel] = callback
        }
      }
    }

    return promise
  }

  function WebSocketChannelMessenger(socket) {
    const {promise, resolve} = createPromiseWithSettler()

    let initialized = false
    let receivers = []

    socket.onmessage = ({data}) => {
      const message = JSON.parse(data)
      if(message.channel === 0) {
        switch(message.message){
          case 'init':
            socket.send(JSON.stringify({channel: 0, message: 'init-ack'}))
          case 'init-ack':
            if(!initialized){
              initialized = true
              resolve({createChannel})
            }
        }
      }
      else {
        const receiver = receivers[message.channel]
        if(receiver)
          receiver(message.message)
        else
          console.log('no receiver', message.channel, message.message)
      }
    }

    socket.send(JSON.stringify({channel: 0, message: 'init'}))

    function createChannel(channel) {
      if(channel < 1){
        throw new Error('channel must be a positive integer')
      }

      return {
        send: message => {
          socket.send(JSON.stringify({channel, message}))
        },
        setReceiver: callback => {
          console.log('registering receiver for channel', channel)
          receivers[channel] = callback
        }
      }
    }

    return promise
  }

  function WebRTCChannel(rtcChannel){
    return {
      send: message => {
        rtcChannel.send(message)
      },
      setReceiver: callback => {
        rtcChannel.onmessage = ({data}) => callback(data)
      }
    }
  }

  function createMockWorkerPair() {
    const a = {
      postMessage: message => {
        if(b.onmessage)
          _.defer(b.onmessage, {data: message})
      }
    }
    const b = {
      postMessage: message => {
        if(a.onmessage)
          _.defer(a.onmessage, {data: message})
      }
    }

    return [a, b]
  }

  function createMockSocketPair() {
    const a = {
      send: message => {
        if(b.onmessage)
          _.defer(b.onmessage, {data: message})
      }
    }
    const b = {
      send: message => {
        if(a.onmessage)
          _.defer(a.onmessage, {data: message})
      }
    }

    return [a, b]
  }

  return {createMockWorkerPair, createMockSocketPair, WebWorkerChannelMessenger, WebSocketChannelMessenger, WebRTCChannel}
})