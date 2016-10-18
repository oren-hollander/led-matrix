'use strict'

define([], () => {

  return rtcConnection => ({
    setRemoteDescription: desc => {
      rtcConnection.setRemoteDescription(desc)
    },
    createAnswer: () => {
      const answer = rtcConnection.createAnswer()
      return answer
    },
    setLocalDescription: desc => {
      rtcConnection.setLocalDescription(desc)
    },
    getLocalDescription: () => {
      const desc = rtcConnection.localDescription
      return desc
    },
    addIceCandidate: candidate => {
      rtcConnection.addIceCandidate(candidate)
    }
  })

})

