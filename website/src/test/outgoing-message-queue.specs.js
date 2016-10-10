'use strict'

define([
  'lodash',
  'rpc/outgoing-message-queue',
  'util/clock',
  'rpc/priority'
], (
  _,
  OutgoingMessageQueue,
  {TestClock},
  {MessagePriorities}
) => {

  describe('Outgoing Message Queue', () => {

    let clock

    beforeEach(() => {
      clock = TestClock()
    })

    it('should trigger immediately', done => {
      const queue = OutgoingMessageQueue(messages => {
        expect(messages).toEqual(['message 1'])
        done()
      }, clock)

      queue.schedule('message 1', MessagePriorities.Immediate)
    })


    it('should trigger batch', done => {
      const queue = OutgoingMessageQueue(messages => {
        expect(messages).toEqual(['message 1', 'message 2', 'message 3'])
        done()
      }, clock)

      queue.schedule('message 1', MessagePriorities.High)
      queue.schedule('message 2', MessagePriorities.High)
      queue.schedule('message 3', MessagePriorities.High)
      clock.tick(1)

    })

    it('should not trigger batch before time passed', done => {
      const drain = jasmine.createSpy()

      const queue = OutgoingMessageQueue(drain, clock)

      queue.schedule('message 1', MessagePriorities.High)
      queue.schedule('message 2', MessagePriorities.High)
      queue.schedule('message 3', MessagePriorities.High)
      expect(drain).not.toHaveBeenCalled()
      done()
    })

    it('should trigger immediate with queued messages in one batch', done => {
      const queue = OutgoingMessageQueue(messages => {
        expect(messages).toEqual(['message 1', 'message 2', 'message 3'])
        done()
      }, clock)

      queue.schedule('message 1', MessagePriorities.High)
      queue.schedule('message 2', MessagePriorities.High)
      queue.schedule('message 3', MessagePriorities.Immediate)
    })

    it('should trigger higher priority after lower priority', done => {
      const queue = OutgoingMessageQueue(messages => {
        expect(messages).toEqual(['message 1', 'message 2', 'message 3'])
        done()
      }, clock)

      queue.schedule('message 1', 100)
      clock.tick(50)
      queue.schedule('message 2', 100)
      clock.tick(40)

      queue.schedule('message 3', 90)
      clock.tick(11)
    })
  })
})
