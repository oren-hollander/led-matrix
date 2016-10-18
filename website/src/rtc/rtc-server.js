'use strict'

define([
  'util/promise'
], (
  {createPromise}
) => {

  function handleAddCandidateError(e) {
    console.log("addICECandidate failed!", e)
  }

  function RTCServer(rtcClient, connection) {

    const promise = createPromise()

    connection.ondatachannel = e => {
      promise.resolve(e.channel)
    }

    connection.onicecandidate = e => {
      if(e.candidate){
        rtcClient.addIceCandidate(e.candidate).catch(handleAddCandidateError)
      }
    }

    return promise
  }

  return RTCServer

})