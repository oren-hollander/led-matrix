'use strict'

define([
  'util/promise'
], (
  {createPromise}
) => {

  function handleAddCandidateError(e) {
    console.log("addICECandidate failed!", e)
  }

  function handleCreateDescriptionError(e) {
    console.log("Unable to create an offer: " + e)
  }


  function RTCClient(rtcServer, connection) {
    const channel = connection.createDataChannel('chat')
    const promise = createPromise()

    channel.onopen = () => {
      promise.resolve(channel)
    }

    channel.onmessage = e => {
      if(client.onmessage)
        client.onmessage(e.data)
    }

    connection.onicecandidate = e => {
      if(e.candidate){
        rtcServer.addIceCandidate(e.candidate).catch(handleAddCandidateError)
      }
    }

    connection.createOffer()
      .then(offer => {
        connection.setLocalDescription(offer)
      })
      .then(() => {
        rtcServer.setRemoteDescription(connection.localDescription)
      })
      .then(() => {
        const r = rtcServer.createAnswer()
        return r
      })
      .then(desc => {
        rtcServer.setLocalDescription(desc)
      })
      .then(() => {
        const desc = rtcServer.getLocalDescription()
        return desc
      })
      .then(description => {
        connection.setRemoteDescription(description)
      })
      .catch(handleCreateDescriptionError)

    return promise
  }

  return RTCClient
})