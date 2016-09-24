'use strict'

define(['messages', '../buffer/proto-buf'], (Messages, protocolCodec) => {

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
      const buf = write(value)
      return {message: {buf: buf}, transferList: [buf]}
    },

    deserialize: value => {
      return read(value.buf)
    }
  }

  return jsonSerializer //  protoBufSerializer
})