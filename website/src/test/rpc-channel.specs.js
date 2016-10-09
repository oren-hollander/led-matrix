'use strict'

define([
  'lodash',
  'rpc/messenger',
  'serialization/json-serializer',
  'rpc/message-rpc',
  'rpc/remote'
], (
  _,
  {MockMessengers},
  JsonSerializer,
  MessageRPC,
  {RemoteFunction}
) => {
  describe('RPC channels', () => {
    let worker1Messenger, worker2Messenger, app1Messenger, app2Messenger

    beforeEach(() => {
      [worker1Messenger, app1Messenger] = MockMessengers()
      [worker2Messenger, app2Messenger] = MockMessengers()
    })

    xit('should connect multiple channles', done => {
      // const worker2SignalChannel = Channel(worker2Messenger, 2)
      //
      // const app1SignalChannel = Channel(app1Messenger, 1)
      // const app2SignalChannel = Channel(app2Messenger, 2)

      // const worker1ChatChannel = Channel(worker1Messenger, 3)
      // const worker2ChatChannel = Channel(worker2Messenger, 3)
      //
      // const app1ChatChannel = Channel(app1Messenger, 3)
      // const app2ChatChannel = Channel(app2Messenger, 3)

      const sendChatMessage = message => {
        console.log(message)
      }

      // Worker 1
      MessageRPC(JsonSerializer).then(rpc => {

        const signalChannel = Channel(worker1Messenger, 1)

        const startChat = channel => {
          rpc.connect(Channel(worker1Messenger, channel), RemoteFunction(sendChatMessage))
        }

        rpc.connect(signalChannel, RemoteFunction(startChat))
      })

      // Worker 2
      MessageRPC(JsonSerializer).then(rpc => {

        const signalChannel = Channel(worker2Messenger, 2)

        const startChat = channel => {
          rpc.connect(Channel(worker2Messenger, channel), RemoteFunction(sendChatMessage))
        }

        rpc.connect(signalChannel, RemoteFunction(startChat))
      })

      // App
      MessageRPC(JsonSerializer).then(rpc => {
        const signalChannel1 = Channel(app1Messenger, 1)
        const signalChannel2 = Channel(app2Messenger, 2)

        Promise.all([rpc.connect(1), rpc.connect(2)]).then(([startChat1, startChat2]) => {
          rpc.relay(3, 4)

          startChat1(3)
          startChat2(4)
        })
      })
    })
  })
})
