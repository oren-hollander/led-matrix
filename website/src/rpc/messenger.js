'use strict'

define([], () => {

  function WebWorkerMessenger(worker) {
    return {
      send: message => {
        worker.postMessage(message)
      },
      setReceiver: callback => {
        worker.onmessage = callback
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
        socket.onmessage = callback
      }
    }
  }

  return {WebWorkerMessenger, WebSocketMessenger}
})