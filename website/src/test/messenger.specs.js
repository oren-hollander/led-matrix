'use strict'

define([
  'lodash',
  'rpc/messenger',
  'rpc/message-rpc',
  'serialization/native-serializer',
  'rpc/remote'
], (
  _,
  {MultiplexedWebWorkerMessenger, createMockWorkerPair},
  MessageRPC,
  NativeSerializer,
  {RemoteApi}
) => {

  const connect = rpc => rpc.connect()

  describe('MultiplexWebWorkerMessenger', () =>  {

    let workerA, workerB

    beforeEach(() => {
      [workerA, workerB] = createMockWorkerPair()
    })

    xit('should multiplex two messengers on a single worker', done => {
      const [sideAOne, sideATwo] = MultiplexedWebWorkerMessenger(workerA, ['one', 'two'])
      const [sideBOne, sideBTwo] = MultiplexedWebWorkerMessenger(workerB, ['one', 'two'])

      const oneApi = {
        add: (a, b) => a + b
      }

      const twoApi = {
        mul: (a, b) => a * b
      }

      MessageRPC(sideAOne, NativeSerializer).then(rpc => rpc.connect(RemoteApi(oneApi)))
      MessageRPC(sideATwo, NativeSerializer).then(rpc => rpc.connect(RemoteApi(twoApi)))

      Promise.all([
        MessageRPC(sideBOne, NativeSerializer).then(connect).then(api => api.add(3, 4)),
        MessageRPC(sideBTwo, NativeSerializer).then(connect).then(api => api.mul(5, 6))
      ]).then(([r1, r2]) => {
        expect(r1).toBe(7)
        expect(r2).toBe(30)
        done()
      })
    })
  })
})