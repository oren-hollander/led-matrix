'use strict'

define(['messages', 'binary-serializer'], (Messages, BinarySerializer) => {

  const jsonSerializer = {
    serialize: value => ({message: JSON.stringify(value), transferList: []}),
    deserialize: value => JSON.parse(value)
  }

  const nativeSerializer = {
    serialize: value => ({message: value, transferList: []}),
    deserialize: value => value
  }

  return jsonSerializer //BinarySerializer
})