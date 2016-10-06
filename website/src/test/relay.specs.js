'use strict'

define([
  'lodash',
  'util/relay',
  'rpc/messenger'
], (
  _,
  Relay,
  {MockMessengers}
) => {

  describe('Relay', () => {

    it('should connect two sets of messengers', done => {
      const [a, b] = MockMessengers()
      const [c, d] = MockMessengers()

      Relay(b, c)

      d.setReceiver(message => {
        expect(message).toEqual('hello')
        done()
      })

      a.send('hello')
    })
  })
})