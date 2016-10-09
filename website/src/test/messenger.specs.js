'use strict'

define([
  'lodash',
  'rpc/messenger',
  'rpc/message-rpc',
  'serialization/native-serializer',
  'rpc/remote'
], (
  _,
  {createMockWorkerPair},
  MessageRPC,
  NativeSerializer,
  {RemoteApi}
) => {

  const connect = rpc => rpc.connect()

  describe('Mock Messenger', () =>  {

    let workerA, workerB

    beforeEach(() => {
      [workerA, workerB] = createMockWorkerPair()
    })

    xit('should ', done => {
    })
  })
})