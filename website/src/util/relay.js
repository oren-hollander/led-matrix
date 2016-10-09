'use strict'

define([], () => {
  function Relay(channelA, channelB){
    channelA.setReceiver(channelB.send)
    channelB.setReceiver(channelA.send)
  }

  return Relay
})