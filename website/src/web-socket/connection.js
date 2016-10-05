'use strict'

define(['lodash', 'util/promise-util'], (_, {createPromiseWithSettler}) => {

  function connect(url, messageHandler) {
    const socket = new WebSocket(`ws://${url}`)

    socket.onmessage = message => messageHandler(message.data)
    socket.onclose = () => {console.log('socket closed')}
    const {promise: connectionPromise, resolve, reject}  = createPromiseWithSettler()

    function closeConnection() {
      socket.close()
    }

    socket.onopen = () => {
      resolve(closeConnection)
    }
    socket.onerror = reject

    return connectionPromise
  }

  return connect
})