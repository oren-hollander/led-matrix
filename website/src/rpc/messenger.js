'use strict'

define([
  'lodash'
], (
  _
) => {

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
          callback(message.data)
        }
      }
    }
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

  return {WebWorkerMessenger, WebSocketMessenger, MockMessengers}
})