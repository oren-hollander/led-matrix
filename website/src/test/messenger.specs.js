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
  describe('MultiplexWebWorkerMessenger', () =>  {

    let workerA, workerB

    beforeEach(() => {
      [workerA, workerB] = createMockWorkerPair()
    })

    it('should multiplex two messengers on a single worker', done => {
      const [sideAOne, sideATwo] = MultiplexedWebWorkerMessenger(workerA, ['one', 'two'])
      const [sideBOne, sideBTwo] = MultiplexedWebWorkerMessenger(workerB, ['one', 'two'])

      const oneApi = {
        add: (a, b) => a + b
      }

      const twoApi = {
        mul: (a, b) => a * b
      }

      MessageRPC(RemoteApi(oneApi), sideAOne, NativeSerializer)
      MessageRPC(RemoteApi(twoApi), sideATwo, NativeSerializer)

      Promise.all([
        MessageRPC({}, sideBOne, NativeSerializer).then(({api}) => api.add(3, 4)),
        MessageRPC({}, sideBTwo, NativeSerializer).then(({api}) => api.mul(5, 6))
      ]).then(([r1, r2]) => {
        expect(r1).toBe(7)
        expect(r2).toBe(30)
        done()
      })
    })
  })
})