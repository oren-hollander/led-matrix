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

    worker.onmessage = ({data}) => {
      if(data.channel === 0) {
        switch(data.message){
          case 'init':
            worker.postMessage({channel: 0, message: 'init-ack'})
          case 'init-ack':
            resolve({createChannel})
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

  // function WebWorkerMessenger(worker) {
  //   return {
  //     send: message => {
  //       if(message instanceof ArrayBuffer){
  //         worker.postMessage({message}, [message])
  //       }
  //       else if (_.isArray(message) && _.every(message, m => m instanceof ArrayBuffer)){
  //         worker.postMessage({message}, message)
  //       }
  //       else {
  //         worker.postMessage({message})
  //       }
  //     },
  //     setReceiver: callback => {
  //       worker.onmessage = ({data}) => {
  //         if(callback)
  //           callback(data.message)
  //       }
  //     }
  //   }
  // }
  //
  // function WebSocketMessenger(socket) {
  //   return {
  //     send: message => {
  //       socket.send(message, error => {
  //         if(error)
  //           console.log('socket send error: ', error)
  //       })
  //     },
  //     setReceiver: callback => {
  //       socket.onmessage = ({data}) => {
  //         if(callback)
  //           callback(data)
  //       }
  //     }
  //   }
  // }

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

  return {createMockWorkerPair, WebWorkerChannelMessenger}
})