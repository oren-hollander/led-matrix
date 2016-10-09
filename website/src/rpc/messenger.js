'use strict'

define([
  'lodash'
], (
  _
) => {

  // function MultiplexedWebWorkerMessenger(worker, keys){
  //   let receivers = {}
  //
  //   worker.onmessage = ({data}) => {
  //     const receiver = receivers[data.key]
  //     if(receiver)
  //       receiver(data.message)
  //   }
  //
  //   return _.map(keys, key => {
  //     return {
  //       send: message => {
  //         if(message instanceof ArrayBuffer){
  //           worker.postMessage({key, message}, [message])
  //         }
  //         else if (_.isArray(message) && _.every(message, m => m instanceof ArrayBuffer)){
  //           worker.postMessage({key, message}, message)
  //         }
  //         else {
  //           worker.postMessage({key, message})
  //         }
  //       },
  //       setReceiver: callback => {
  //         receivers[key] = callback
  //       }
  //     }
  //   })
  // }

  function WebWorkerChannelMessenger(worker) {
    let receivers = []
    let connected = false
    worker.onmessage = ({data}) => {
      if(data.channel === 0) {
        switch(data.message){
          case 'init':
            worker.postMessage({channel: 0, message: 'init-ack'})
          case 'init-ack':
            connected = true
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
      if(!connected){
        throw new Error('Messenger not connected')
      }

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

    return {createChannel}
  }

  function WebWorkerMessenger(worker) {
    return {
      send: message => {
        if(message instanceof ArrayBuffer){
          worker.postMessage({message}, [message])
        }
        else if (_.isArray(message) && _.every(message, m => m instanceof ArrayBuffer)){
          worker.postMessage({message}, message)
        }
        else {
          worker.postMessage({message})
        }
      },
      setReceiver: callback => {
        worker.onmessage = ({data}) => {
          if(callback)
            callback(data.message)
        }
      }
    }
  }

  // todo handle array of ArrayBuffer
  function WebSocketMessenger(socket) {
    return {
      send: message => {
        socket.send(message, error => {
          if(error)
            console.log('socket send error: ', error)
        })
      },
      setReceiver: callback => {
        socket.onmessage = ({data}) => {
          if(callback)
            callback(data)
        }
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

  function MockMessengers() {

    let onAMessage
    let onBMessage

    const a = {
      send: message => {
        if(onBMessage){
          _.defer(onBMessage, message)
        }
      },
      setReceiver: callback => {
        onAMessage = callback
      }
    }

    const b = {
      send: message => {
        if (onAMessage){
          _.defer(onAMessage, message)
        }
      },
      setReceiver: callback => {
          onBMessage = callback
      }
    }

    return [a, b]
  }

  return {WebWorkerMessenger, WebSocketMessenger, MockMessengers, createMockWorkerPair}
})