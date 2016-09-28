'use strict'

define(['lodash', 'messages', './buffer/proto-buf'], (_, Messages, protocolCodec) => {

  function JsonSerializer() {
    return {
      serialize: value => ({message: JSON.stringify(value), transferList: []}),
      deserialize: value => JSON.parse(value)
    }
  }

  function NativeSerializer() {
    return {
      serialize: value => ({message: value, transferList: []}),
      deserialize: value => value
    }
  }

  function ProtoBufSerializer() {

    const {read, write} = protocolCodec(Messages.messageProtocol)

    return {
      serialize: value => {
        const buffers = write('Message', value)
        return {message: {buffers}, transferList: buffers}
      },

      deserialize: value => {
        return read('Message', value.buffers)
      }
    }
  }

  return ProtoBufSerializer // ProtoBufSerializer // JsonSerializer // NativeSerializer
})