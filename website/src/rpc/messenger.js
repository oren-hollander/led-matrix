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

  function WebWorkerMessenger(worker, serializer) {
    return {
      send: message => {
        const serialized = serializer.serialize(message)
        if(serialized instanceof ArrayBuffer){
          worker.postMessage({message: serialized}, [serialized])
        }
        else if (_.isArray(serialized) && _.every(serialized, m => m instanceof ArrayBuffer)){
          worker.postMessage({message: serialized}, serialized)
        }
        else {
          worker.postMessage({message: serialized})
        }
      },
      setReceiver: callback => {
        worker.onmessage = ({data}) => {
          if(callback)
            callback(serializer.deserialize(data.message))
        }
      }
    }
  }

  // todo handle array of ArrayBuffer
  function WebSocketMessenger(socket, serializer) {
    return {
      send: message => {
        const serialized = serializer.serialize(message)
        socket.send(serialized, error => {
          if(error)
            console.log('socket send error: ', error)
        })
      },
      setReceiver: callback => {
        socket.onmessage = ({data}) => {
          if(callback)
            callback(serializer.deserialize(data))
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