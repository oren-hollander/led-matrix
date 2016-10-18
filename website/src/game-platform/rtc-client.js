'use strict'

requirejs.config({
  baseUrl: '/src',
  paths: {
    lodash: ['lib/lodash']
  }
});

require([
  'rpc/messenger',
  'rpc/message-rpc',
  'serialization/json-serializer',
  'rpc/monitor',
  'rpc/remote'
], (
  {WebSocketChannelMessenger},
  MessageRPC,
  JsonSerializer,
  {RpcMonitor, ConsoleLogger},
  {RemoteApi, RemoteFunction}
) => {

  window.RTCPeerConnection = webkitRTCPeerConnection

  const signalSocket = new WebSocket(`ws://${window.location.host}`)
  signalSocket.onopen = () => {
    WebSocketChannelMessenger(signalSocket).then(messenger => {
      MessageRPC(messenger.createChannel(1), JsonSerializer).then(rpc => {
        const connect = isClient => {
          if(isClient)
            connectClient(messenger.createChannel(2))
          else
            connectServer(messenger.createChannel(2))
        }

        rpc.connect(RemoteFunction(connect))
      })
    })
  }

  var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]}

  function handleCreateDescriptionError(error) {
    console.log("Unable to create an offer: " + error.toString())
  }

  function handleAddCandidateError(e) {
    console.log("Oh noes! addICECandidate failed!")
  }

  function connectClient(channel) {
    const clientConnection = new RTCPeerConnection(peerConnectionConfig)
    const clientRemoteApi = RemoteApi(RTCClientRemoteApi(clientConnection))

    MessageRPC(channel, JsonSerializer).then(rpc => {
      rpc.connect(clientRemoteApi).then(serverRemoteApi => {
        RTCClient(serverRemoteApi, clientConnection)
      })
    })
  }

  function connectServer(channel) {
    const serverConnection = new RTCPeerConnection(peerConnectionConfig)
    const serverRemoteApi = RemoteApi(RTCServerRemoteApi(serverConnection))

    MessageRPC(channel, JsonSerializer).then(rpc => {
      rpc.connect(serverRemoteApi).then(clientRemoteApi => {
        RTCServer(clientRemoteApi, serverConnection)
      })
    })
  }

  function RTCClient(rtcServer, connection) {
    const channel = connection.createDataChannel('chat')

    channel.onopen = () => {
      channel.send('Hello, World! RTC')
    }

    channel.onmessage = e => {
      console.log('local', e.data)
    }

    connection.onicecandidate = e => {
      if(e.candidate){
        rtcServer.addIceCandidate(e.candidate).catch(handleAddCandidateError)
      }
    }

    connection.createOffer()
      .then(offer => {
        connection.setLocalDescription(offer)}
      )
      .then(() => {
        rtcServer.setRemoteDescription(connection.localDescription)
      })
      .then(() => {
        const answer = rtcServer.createAnswer()
        return answer
      })
      .then(answer => {
        rtcServer.setLocalDescription(answer)
      })
      .then(() => {
        const description = rtcServer.getLocalDescription()
        return description
      })
      .then(description => {
        connection.setRemoteDescription(description)
      })
      .catch(handleCreateDescriptionError)
  }

  function RTCServer(rtcClient, connection) {

    connection.ondatachannel = event => {
      event.channel.onmessage = e => {
        console.log('remote', e.data)
        event.channel.send("Hello back")
      }
    }

    connection.onicecandidate = e => {
      console.log(e.candidate)
      if(e.candidate){
        rtcClient.addIceCandidate(e.candidate).catch(handleAddCandidateError)
      }
    }
  }

  const RTCServerRemoteApi = rtcConnection => ({
    setRemoteDescription: description => rtcConnection.setRemoteDescription(description),
    createAnswer: () => {
      return rtcConnection.createAnswer()
    },
    setLocalDescription: description => {
      return rtcConnection.setLocalDescription(description)
    },
    getLocalDescription: () => {
      return rtcConnection.localDescription
    },
    addIceCandidate: candidate => {
      rtcConnection.addIceCandidate(candidate)
    }
  })

  const RTCClientRemoteApi = rtcConnection => {
    return {
      addIceCandidate: candidate => {
        return rtcConnection.addIceCandidate(candidate)
      }
    }
  }

})