'use strict'

define(['messages', 'priority'], (Messages, {MessagePriorities}) => {

  const encodeMessageTypes = {
    [Messages.Types.Init]: 0,
    [Messages.Types.Batch]: 1,
    [Messages.Types.Call]: 2,
    [Messages.Types.Return]: 3,
    [Messages.Types.Error]: 4,
    [Messages.Types.DataValue]: 5,
    [Messages.Types.ApiValue]: 6
  }

  const decodeMessageType = (code) => {
    switch (code) {
      case 0: return Messages.Types.Init
      case 1: return Messages.Types.Batch
      case 2: return Messages.Types.Call
      case 3: return Messages.Types.Return
      case 4: return Messages.Types.Error
      case 5: return Messages.Types.DataValue
      case 6: return Messages.Types.ApiValue
      default: throw `Unknown message type code: ${code}`
    }
  }

  const encodeMessagePriorities = {
    [MessagePriorities.Immediate]: 0,
    [MessagePriorities.High]: 1,
    [MessagePriorities.Medium]: 2,
    [MessagePriorities.Low]: 3,
    [MessagePriorities.None]: 4
  }

  const decodeMessagePriority = code => {
    switch(code) {
      case 0: return MessagePriorities.Immediate
      case 1: return MessagePriorities.High
      case 2: return MessagePriorities.Medium
      case 3: return MessagePriorities.Low
      case 4: return MessagePriorities.None
      default: throw `Unknown message priority code: ${code}`
    }
  }

  function readMessage(buf) {

    const view = new DataView(buf)
    let offset = 0

    const readUint32 = () => {
      const r = view.getUint32(offset)
      offset += 4
      return r
    }

    const readUint16 = () => {
      const r = view.getUint16(offset)
      offset += 2
      return r
    }

    const readUint8 = () => {
      const r = view.getUint8(offset)
      offset += 2
      return r
    }

    const readString = () => {
      const length = readUint16()

      const r = String.fromCharCode(... new Uint16Array(buf, offset, length))
      offset += length * 2
      return r
    }

    const readArray = elementReader => {
      const length = readUint16()
      const arr = []
      for(let i = 0; i < length; i++){
        arr.push(elementReader())
      }
      return arr
    }

    const readDataValue = () => {
      return Messages.rpcDataValue(JSON.parse(readString()))
    }

    const readApiValue = () => {
      // writeUint8(encodeMessageTypes[Messages.Types.ApiValue])
      const api = readArray(readString)()
      const stub = readUint32()
      return Messages.rpcApiValue(api, stub)
    }

    const readCallValue = () => {
      const type = decodeMessageType(readUint8())
      switch (type) {
        case Messages.Types.DataValue:
          readDataValue()
          break
        case Messages.Types.ApiValue:
          readApiValue()
          break
      }
    }

    const readCallMessage = () => {
      const id = readUint32()
      const stub = readUint32()
      const func = readString()
      const args = readArray(readCallValue)()
      const returnPriority = decodeMessagePriority(readUint8())
      return Messages.rpcCall(id, stub, func, args, returnPriority)
    }

    const readReturnMessage = () => {
      const id = readUint32()
      const stub = readUint32()
      const value = readCallValue()
      return Messages.rpcReturn(id, stub, value)
    }

    const readErrorMessage = () => {
      const id = readUint32()
      const stub = readUint32()
      const error = readString()
      return Messages.rpcError(id, stub, error)
    }

    const readRpcMessage = () => {
      const type = decodeMessageType(readUint8())
      switch (type) {
        case Messages.Types.Call:
          return readCallMessage()
        case Messages.Types.Return:
          return readReturnMessage()
        case Messages.Types.Error:
          return readErrorMessage()
      }
    }

    const readInitMessage = () => Messages.init(readArray(readString)())

    const readBatchMessage = () => Messages.batch(readArray(readRpcMessage)())

    const readMessage = () => {
      const type = decodeMessageType(readUint8())
      switch(type) {
        case Messages.Types.Init:
          return readInitMessage()
        case Messages.Types.Batch:
          return readBatchMessage()
      }
    }

    return readMessage()
  }

  function writeMessage(message) {

    const measureUint32 = () => 4

    function writeUint32(i) {
      view.setUint32(offset, i)
      offset += 4
    }

    const measureUint16 = () => 2
    function writeUint16(i) {
      view.setUint16(offset, i)
      offset += 2
    }

    const measureUint8 = () => 1
    function writeUint8(i) {
      view.setUint8(offset, i)
      offset += 1
    }

    const measureString = str => measureUint16() + 2 * str.length

    const writeString = str => {
      writeUint16(str.length)

      const arr = new Uint16Array(view.buffer, offset)
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i)
      }
      offset += str.length * 2
    }

    const measureArray = elementMeasurer => arr => {
      let length = measureUint16()
      for(let i = 0; i < arr.length; i++) {
        length += elementMeasurer(arr[i])
      }
      return length
    }

    const writeArray = elementWriter => arr => {
      writeUint16(arr.length)
      for(let i = 0; i < arr.length; i++) {
        elementWriter(arr[i])
      }
    }

    const measureDataValue = value => measureString(JSON.stringify(value.data))

    const writeDataValue = value => {
      writeUint8(encodeMessageTypes[Messages.Types.DataValue])
      writeString(JSON.stringify(value.data))
    }

    const measureApiValue = value => measureArray(measureString)(value.api) + measureUint32()

    const writeApiValue = value => {
      writeUint8(encodeMessageTypes[Messages.Types.ApiValue])
      writeArray(writeString)(value.api)
      writeUint32(value.stub)
    }

    const measureCallValue = value => {
      switch (value.type) {
        case Messages.Types.DataValue:
          return measureDataValue(value)
        case Messages.Types.ApiValue:
          return measureApiValue(value)
        default:
          throw `Unknown value type: ${value.type}`
      }
    }

    const writeCallValue = value => {
      switch (value.type) {
        case Messages.Types.DataValue:
          writeDataValue(value)
          break
        case Messages.Types.ApiValue:
          writeApiValue(value)
          break
        default:
          throw `Unknown value type: ${value.type}`
      }
    }

    const measureCallMessage = callMessage =>
      measureUint8() +
      measureUint32() +
      measureUint32() +
      measureString(callMessage.func) +
      measureArray(measureCallValue)(callMessage.args) +
      measureUint8()

    const writeCallMessage = callMessage => {
      writeUint8(encodeMessageTypes[Messages.Types.Call])
      writeUint32(callMessage.id)
      writeUint32(callMessage.stub)
      writeString(callMessage.func)
      writeArray(writeCallValue)(callMessage.args)
      writeUint8(encodeMessagePriorities[callMessage.returnPriority])
    }

    const measureReturnMessage = returnMessage =>
      measureUint8() +
      measureUint32() +
      measureUint32() +
      measureCallValue(returnMessage.value)

    const writeReturnMessage = returnMessage => {
      writeUint8(encodeMessageTypes[Messages.Types.Return])
      writeUint32(returnMessage.id)
      writeUint32(returnMessage.stub)
      writeCallValue(returnMessage.value)
    }

    const measureErrorMessage = errorMessage =>
      measureUint8() +
      measureUint32() +
      measureUint32() +
      measureString(errorMessage.error)

    const writeErrorMessage = errorMessage => {
      writeUint8(encodeMessageTypes[Messages.Types.Error])
      writeUint32(errorMessage.id)
      writeUint32(errorMessage.stub)
      writeString(errorMessage.error)
    }

    const writeRpcMessage = rpcMessage => {
      switch (rpcMessage.type) {
        case Messages.Types.Call:
          writeCallMessage(view, rpcMessage)
          break
        case Messages.Types.Return:
          writeReturnMessage(view, rpcMessage)
          break
        case Messages.Types.Error:
          writeErrorMessage(view, rpcMessage)
          break
        default:
          throw `Unknown RPC message type: ${rpcMessage.type}`
      }
    }

    const measureRpcMessage = rpcMessage => {
      switch (rpcMessage.type) {
        case Messages.Types.Call:
          return measureCallMessage(view, rpcMessage)
        case Messages.Types.Return:
          return measureReturnMessage(view, rpcMessage)
        case Messages.Types.Error:
          return measureErrorMessage(view, rpcMessage)
        default:
          throw `Unknown RPC message type: ${rpcMessage.type}`
      }
    }

    const measureBatchMessage = message => measureUint8() + measureArray(measureRpcMessage)(message.rpcMessages)

    const writeBatchMessage = message => {
      writeUint8(encodeMessageTypes[Messages.Types.Batch])
      writeArray(writeRpcMessage)(message.rpcMessages)
    }

    const measureInitMessage = message => measureUint8() + measureArray(measureString)(message.api)

    const writeInitMessage = message => {
      writeUint8(encodeMessageTypes[Messages.Types.Init])
      writeArray(writeString)(message.api)
    }

    const measureMessage = message => {
      switch(message.type) {
        case Messages.Types.Init:
          return measureInitMessage(message)
        case Messages.Types.Batch:
          return measureBatchMessage(message)
        default:
          throw `Unknown message type: ${message.type}`
      }
    }

    const writeMessage = message => {
      switch(message.type) {
        case Messages.Types.Init:
          writeInitMessage(message)
          break
        case Messages.Types.Batch:
          writeBatchMessage(message)
          break
        default:
          throw `Unknown message type: ${message.type}`
      }
    }

    const buf = new ArrayBuffer(measureMessage())
    const view = new DataView(buf)
    let offset = 0
    writeMessage(message)
    return buf
  }

  return {
    serialize: value => {
      const buf = writeMessage(value)
      return {
        message: {buf},
        transferList: [buf]
      }
    },
    deserialize: value => {
      return readMessage(value.buf)
    }
  }
})

