'use strict'

define([
  'lodash'
], (
  _
) => {

  function MultiplexedWebWorkerMessenger(worker, keys){
    let receivers = {}

    worker.onmessage = ({data}) => {
      const receiver = receivers[data.key]
      if(receiver)
        receiver(data.message)
    }

    return _.map(keys, key => {
      return {
        send: message => {
          if(message instanceof ArrayBuffer){
            worker.postMessage({key, message}, [message])
          }
          else if (_.isArray(message) && _.every(message, m => m instanceof ArrayBuffer)){
            worker.postMessage({key, message}, message)
          }
          else {
            worker.postMessage({key, message})
          }
        },
        setReceiver: callback => {
          receivers[key] = callback
        }
      }
    })
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

  function WebSocketMessenger(socket) {
    return {
      send: message => {
        socket.send(message, error => {
          if(error)
            console.log('socket send error: ', error, message)
        })
      },
      setReceiver: callback => {
        socket.onmessage = message => {
          if(callback)
            callback(message.data)
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

  return {WebWorkerMessenger, WebSocketMessenger, MultiplexedWebWorkerMessenger, MockMessengers, createMockWorkerPair}
})