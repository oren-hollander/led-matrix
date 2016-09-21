'use strict'

require(['message-rpc'], (MessageRPC) => {
  const api = {
    add: (a, b) => a + b,
    div: (a, b) => {
      if (b === 0)
        throw 'division by zero error'

      return a / b
    }
  }

  MessageRPC(api, new Worker('app.js'))
})