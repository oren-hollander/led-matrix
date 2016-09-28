'use strict'

define(['messages', './buffer/proto-buf'], (Messages, protocolCodec) => {

  const jsonSerializer = {
    serialize: value => ({message: JSON.stringify(value), transferList: []}),
    deserialize: value => JSON.parse(value)
  }

  const nativeSerializer = {
    serialize: value => ({message: value, transferList: []}),
    deserialize: value => value
  }

  const {read, write} = protocolCodec(Messages.messageProtocol)

  const protoBufSerializer = {
    serialize: value => {
      const buffers = write(value)
      return {message: {buffers}, transferList: buffers}
    },

    deserialize: value => {
      return read(value.buffers)
    }
  }

  return protoBufSerializer // nativeSerializer // jsonSerializer // protoBufSerializer
})