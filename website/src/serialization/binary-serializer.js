'use strict'

define([
  'lodash',
  'util/enum',
  'rpc/messages',
  'buffer/serial-buffer',
  'buffer/io',
  'serialization/serialize'
], (
  _,
  Enum,
  Messages,
  {SerialBufferWriter, SerialBufferReader},
  {DataWriter, DataReader},
  {Serializable}
) => {
  const MessageTypeCodes = Enum([
    Messages.Types.Init,
    Messages.Types.Batch,
    Messages.Types.ApiCall,
    Messages.Types.FunctionCall,
    Messages.Types.Return,
    Messages.Types.Error,
    Messages.Types.StubPropertyUpdate,
    Messages.Types.ProxyPropertyUpdate,
    Messages.Types.Value,
    Messages.Types.Api,
    Messages.Types.Function,
    Messages.Types.SharedObject
  ])

  function writeInit(writer, init){
    writer.uint8(init.api.length)
    _.forEach(init.api, writer.string)
  }

  function readInit(reader) {
    const length = reader.uint8()
    const api = new Array(length)
    for(let i = 0; i < length; i++){
      api[i] = reader.string()
    }
    return Messages.init(api)
  }

  function writeBatch(writer, batch){
    writer.uint16(batch.rpcMessages.length)

    _.forEach(batch.rpcMessages, rpcMessage => {
      writer.uint8(MessageTypeCodes.value(rpcMessage.type))
      switch(rpcMessage.type){
        case Messages.Types.ApiCall:
          writeApiCall(writer, rpcMessage)
          break
        case Messages.Types.FunctionCall:
          writeFunctionCall(writer, rpcMessage)
          break
        case Messages.Types.Return:
          writeReturn(writer, rpcMessage)
          break
        case Messages.Types.Error:
          writeError(writer, rpcMessage)
          break
        case Messages.Types.StubPropertyUpdate:
          writeStubPropertyUpdate(writer, rpcMessage)
          break
        case Messages.Types.ProxyPropertyUpdate:
          writeProxyPropertyUpdate(writer, rpcMessage)
          break
        default:
          throw new Error(`unknown message type ${rpcMessage.type}`)
      }
    })
  }

  function readBatch(reader){
    const messageCount = reader.uint16()
    const rpcMessages = new Array(messageCount)
    for(let i = 0; i < messageCount; i++){
      var type = MessageTypeCodes.name(reader.uint8())
      switch(type){
        case Messages.Types.ApiCall:
          rpcMessages[i] = readApiCall(reader)
          break
        case Messages.Types.FunctionCall:
          rpcMessages[i] = readFunctionCall(reader)
          break
        case Messages.Types.Return:
          rpcMessages[i] = readReturn(reader)
          break
        case Messages.Types.Error:
          rpcMessages[i] = readError(reader)
          break
        case Messages.Types.StubPropertyUpdate:
          rpcMessages[i] = readStubPropertyUpdate(reader)
          break
        case Messages.Types.ProxyPropertyUpdate:
          rpcMessages[i] = readProxyPropertyUpdate(reader)
          break
        default:
          throw new Error(`unknown message type ${type}`)
      }
    }
    return Messages.batch(rpcMessages)
  }

  function writeApiCall(writer, call){
    writer.uint32(call.id)
    writer.uint32(call.stub)
    writer.string(call.func)
    writer.uint16(call.args.length)
    _.forEach(call.args, arg => {
      writer.uint8(MessageTypeCodes.value(arg.type))
      switch(arg.type) {
        case Messages.Types.Value:
          writeValue(writer, arg)
          break
        case Messages.Types.Api:
          writeApi(writer, arg)
          break
        case Messages.Types.Function:
          writeFunction(writer, arg)
          break
        case Messages.Types.SharedObject:
          writeSharedObject(writer, arg)
          break
        default:
          throw new Error(`unknown message type ${arg.type}`)
      }
    })
    writer.int8(call.returnPriority)
  }

  function readApiCall(reader){
    const id = reader.uint32()
    const stub = reader.uint32()
    const func = reader.string()
    const argCount = reader.uint16()
    const args = new Array(argCount)
    for(let i = 0; i < argCount; i++){
      var type = MessageTypeCodes.name(reader.uint8())
      switch(type){
        case Messages.Types.Value:
          args[i] = readValue(reader)
          break
        case Messages.Types.Api:
          args[i] = readApi(reader)
          break
        case Messages.Types.Function:
          args[i] = readFunction(reader)
          break
        case Messages.Types.SharedObject:
          args[i] = readSharedObject(reader)
          break
        default:
          throw new Error(`unknown message type ${type}`)
      }
    }
    const returnPriority = reader.int8()
    return Messages.rpcApiCall(id, stub, func, args, returnPriority)
  }

  function writeFunctionCall(writer, call){
    writer.uint32(call.id)
    writer.uint32(call.stub)
    writer.uint16(call.args.length)
    _.forEach(call.args, arg => {
      writer.uint8(MessageTypeCodes.value(arg.type))
      switch(arg.type) {
        case Messages.Types.Value:
          writeValue(writer, arg)
          break
        case Messages.Types.Api:
          writeApi(writer, arg)
          break
        case Messages.Types.Function:
          writeFunction(writer, arg)
          break
        case Messages.Types.SharedObject:
          writeSharedObject(writer, arg)
          break
        default:
          throw new Error(`unknown message type ${arg.type}`)
      }
    })
    writer.int8(call.returnPriority)
  }

  function readFunctionCall(reader){
    const id = reader.uint32()
    const stub = reader.uint32()
    const argCount = reader.uint16()
    const args = new Array(argCount)
    for(let i = 0; i < argCount; i++){
      var type = MessageTypeCodes.name(reader.uint8())
      switch(type){
        case Messages.Types.Value:
          args[i] = readValue(reader)
          break
        case Messages.Types.Api:
          args[i] = readApi(reader)
          break
        case Messages.Types.Function:
          args[i] = readFunction(reader)
          break
        case Messages.Types.SharedObject:
          args[i] = readSharedObject(reader)
          break
        default:
          throw new Error(`unknown message type ${type}`)
      }
    }
    const returnPriority = reader.int8()
    return Messages.rpcFunctionCall(id, stub, args, returnPriority)
  }

  function writeReturn(writer, ret){
    writer.uint32(ret.id)
    writer.uint32(ret.stub)
    writer.uint8(MessageTypeCodes.value(ret.value.type))
    switch(ret.value.type) {
      case Messages.Types.Value:
        writeValue(writer, ret.value)
        break
      case Messages.Types.Api:
        writeApi(writer, ret.value)
        break
      case Messages.Types.Function:
        writeFunction(writer, ret.value)
        break
      case Messages.Types.SharedObject:
        writeSharedObject(writer, ret.value)
        break
      default:
        throw new Error(`unknown message type ${ret.value.type}`)
    }
  }

  function readReturn(reader){
    const id = reader.uint32()
    const stub = reader.uint32()
    var type = MessageTypeCodes.name(reader.uint8())
    let value
    switch(type){
      case Messages.Types.Value:
        value = readValue(reader)
        break
      case Messages.Types.Api:
        value = readApi(reader)
        break
      case Messages.Types.Function:
        value = readFunction(reader)
        break
      case Messages.Types.SharedObject:
        value = readSharedObject(reader)
        break
      default:
        throw new Error(`unknown message type ${type}`)
    }
    return Messages.rpcReturn(id, stub, value)
  }

  function writeError(writer, error){
    writer.uint32(error.id)
    writer.uint32(error.stub)
    writer.string(error.error)
  }

  function readError(reader){
    return Messages.rpcError(reader.uint32(), reader.uint32(), reader.string())
  }

  function writeStubPropertyUpdate(writer, property){
    writer.uint32(property.stub)
    writer.string(property.prop)
    writer.string(JSON.stringify(property.value))
  }

  function readStubPropertyUpdate(reader){
    return Messages.rpcStubPropertyUpdate(reader.uint32(), reader.string(), JSON.parse(reader.string()))
  }

  function writeProxyPropertyUpdate(writer, property){
    writer.uint32(property.stub)
    writer.string(property.prop)
    writer.string(JSON.stringify(property.value))
  }

  function readProxyPropertyUpdate(reader){
    return Messages.rpcProxyPropertyUpdate(reader.uint32(), reader.string(), JSON.parse(reader.string()))
  }

  function writeValue(writer, value){
    if(value.value[Serializable]){
      writer.uint8(0)
      writer.uint32(value.value.length)
      _.forEach(value.value, ({red, green, blue}) => {
        writer.uint8(red)
        writer.uint8(green)
        writer.uint8(blue)
      })
    }
    else {
      writer.uint8(1)
      writer.string(JSON.stringify(value.value))
    }
  }

  function readValue(reader){
    if(reader.uint8() === 0){
      const length = reader.uint32()
      const pixels = new Array(length)
      for(let i = 0; i < length; i++){
        pixels[i] = {red: reader.uint8(), green: reader.uint8(), blue: reader.uint8()}
      }
      return Messages.rpcValue(pixels)
    }
    else {
      return Messages.rpcValue(JSON.parse(reader.string()))
    }
  }

  function writeApi(writer, api){
    writer.uint32(api.stub)
    writer.uint8(api.length)
    _.forEach(api, writer.string)
  }

  function readApi(reader){
    const stub = reader.uint32()
    const functionCount = reader.uint8()
    const functionNames = new Array(functionCount)
    for(let i = 0; i < functionCount; i++){
      functionNames[i] = reader.string()
    }
    return Messages.rpcApi(stub, functionNames)
  }

  function writeFunction(writer, func){
    writer.uint32(func.stub)
  }

  function readFunction(reader){
    return Messages.rpcFunction(reader.uint32)
  }

  function writeSharedObject(writer, sharedObject){
    writer.uint32(sharedObject.stub)
    writer.string(JSON.stringify(sharedObject.properties))
  }

  function readSharedObject(reader){
    return Messages.rpcSharedObject(reader.uint32(), JSON.parse(reader.string()))
  }

  return {
    serialize: value => {

      const writer = DataWriter(SerialBufferWriter())
      writer.uint8(MessageTypeCodes.value(value.type))
      switch(value.type){
        case Messages.Types.Init:
          writeInit(writer, value)
          break
        case Messages.Types.Batch:
          writeBatch(writer, value)
          break
        default:
          throw new Error(`unknown message type ${value.type}`)
      }

      return writer.buffers
    },
    deserialize: value => {
      const reader = DataReader(SerialBufferReader(value))

      switch (MessageTypeCodes.name(reader.uint8())) {
        case Messages.Types.Init:
          return readInit(reader)
        case Messages.Types.Batch:
          return readBatch(reader);
        default:
          throw new Error(`unknown message type ${value.type}`)
      }
    }
  }
})