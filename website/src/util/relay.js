'use strict'

define([], () => {
  function Relay(messengerA, messengerB){
    messengerA.setReceiver(messengerB.send)
    messengerB.setReceiver(messengerA.send)
  }

  return Relay
})