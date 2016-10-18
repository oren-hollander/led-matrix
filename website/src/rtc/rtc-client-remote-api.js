'use strict'

define([], () => {
  return rtcConnection => ({
    addIceCandidate: candidate => {
      rtcConnection.addIceCandidate(candidate)
    }
  })
})