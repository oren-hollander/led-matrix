'use strict'

define([
  'lodash',
  'util/relay',
  'rpc/messenger'
], (
  _,
  Relay,
  {createMockWorkerPair, createMockSocketPair, WebWorkerChannelMessenger, WebSocketChannelMessenger}
) => {

  describe('Relay', () => {

    let channelA, channelB, channelC, channelD

    beforeEach(done => {
      const [workerA, workerB] = createMockWorkerPair()
      const [workerC, workerD] = createMockWorkerPair()
      Promise.all([
        WebWorkerChannelMessenger(workerA),
        WebWorkerChannelMessenger(workerB),
        WebWorkerChannelMessenger(workerC),
        WebWorkerChannelMessenger(workerD)
      ]).then(([messengerA, messengerB]) => {
        channelA = messengerA.createChannel(1)
        channelB = messengerB.createChannel(1)
        channelC = messengerB.createChannel(1)
        channelD = messengerB.createChannel(1)
        done()
      })
    })

    it('should connect two sets of worker messengers', done => {

      Relay(channelB, channelC)

      channelD.setReceiver(message => {
        expect(message).toEqual('hello')
        done()
      })

      channelA.send('hello')
    })
  })

  describe('Relay', () => {

    let channelA, channelB, channelC, channelD

    beforeEach(done => {
      const [socketA, socketB] = createMockSocketPair()
      const [socketC, socketD] = createMockSocketPair()
      Promise.all([
        WebSocketChannelMessenger(socketB),
        WebSocketChannelMessenger(socketA),
        WebSocketChannelMessenger(socketD),
        WebSocketChannelMessenger(socketC)
      ]).then(([messengerA, messengerB]) => {
        channelA = messengerA.createChannel(1)
        channelB = messengerB.createChannel(1)
        channelC = messengerB.createChannel(1)
        channelD = messengerB.createChannel(1)
        done()
      })
    })

    it('should connect two sets of socket messengers', done => {

      Relay(channelB, channelC)

      channelD.setReceiver(message => {
        expect(message).toEqual('hello')
        done()
      })

      channelA.send('hello')
    })
  })

})