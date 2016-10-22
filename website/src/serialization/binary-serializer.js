'use strict'

define([
  'lodash',
  'util/enum',
  'rpc/messages',
  'buffer/serial-buffer',
  'buffer/buffer',
  'buffer/io',
  'serialization/serialize'
], (
  _,
  Enum,
  Messages,
  {SerialBufferWriter, SerialBufferReader},
  {BufferWriter, BufferReader, BufferSizeWriter},
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

  function BinarySerializer(valueSerializers) {
    const valueSerializerCodes = Enum(_(valueSerializers).keys().sortBy().value())

    function writeInit(writer, init){
      writer.uint32(init.rootRef)
      _.forEach(init.api, writer.string)
    }

    function readInit(reader) {
      const rootRef = reader.uint32()
      return Messages.init(rootRef)
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
      writer.uint32(call.ref)
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
      const ref = reader.uint32()
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
      return Messages.rpcApiCall(id, ref, func, args, returnPriority)
    }

    function writeFunctionCall(writer, call){
      writer.uint32(call.id)
      writer.uint32(call.ref)
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
      const ref = reader.uint32()
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
      return Messages.rpcFunctionCall(id, ref, args, returnPriority)
    }

    function writeReturn(writer, ret){
      writer.uint32(ret.id)
      writer.uint32(ret.ref)
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
      const ref = reader.uint32()
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
      return Messages.rpcReturn(id, ref, value)
    }

    function writeError(writer, error){
      writer.uint32(error.id)
      writer.uint32(error.ref)
      writer.string(error.error)
    }

    function readError(reader){
      return Messages.rpcError(reader.uint32(), reader.uint32(), reader.string())
    }

    function writeStubPropertyUpdate(writer, property){
      writer.uint32(property.ref)
      writer.string(property.prop)
      writer.string(JSON.stringify(property.value))
    }

    function readStubPropertyUpdate(reader){
      return Messages.rpcStubPropertyUpdate(reader.uint32(), reader.string(), JSON.parse(reader.string()))
    }

    function writeProxyPropertyUpdate(writer, property){
      writer.uint32(property.ref)
      writer.string(property.prop)
      writer.string(JSON.stringify(property.value))
    }

    function readProxyPropertyUpdate(reader){
      return Messages.rpcProxyPropertyUpdate(reader.uint32(), reader.string(), JSON.parse(reader.string()))
    }

    const JsonSerializedValue = 0
    const UndefinedSerializedValue = 1
    const customSerializedValue = serializerName => 2 + valueSerializerCodes.value(serializerName)
    const customSerializerName = serializerCode => valueSerializerCodes.name(serializerCode - 2)

    function writeValue(writer, value){
      if(value.value){
        const serializerName = value.value[Serializable]
        if(serializerName){
          writer.uint8(customSerializedValue(serializerName))
          valueSerializers[serializerName].writeValue(writer, value.value)
        }
        else {
          writer.uint8(JsonSerializedValue)
          writer.string(JSON.stringify(value.value))
        }
      }
      else {
        writer.uint8(UndefinedSerializedValue)
      }
    }

    function readValue(reader){
      const serializerCode = reader.uint8()
      switch (serializerCode) {
        case JsonSerializedValue:
          return Messages.rpcValue(JSON.parse(reader.string()))
        case UndefinedSerializedValue:
          return Messages.rpcValue(undefined)
        default:
          const serializerName = customSerializerName(serializerCode)
          const value = valueSerializers[serializerName].readValue(reader)
          return Messages.rpcValue(value)
      }
    }

    function writeApi(writer, api){
      writer.uint32(api.ref)
      writer.uint8(api.functionNames.length)
      _.forEach(api.functionNames, writer.string)
    }

    function readApi(reader){
      const ref = reader.uint32()
      const functionCount = reader.uint8()
      const functionNames = new Array(functionCount)
      for(let i = 0; i < functionCount; i++){
        functionNames[i] = reader.string()
      }
      return Messages.rpcApi(ref, functionNames)
    }

    function writeFunction(writer, func){
      writer.uint32(func.ref)
    }

    function readFunction(reader){
      return Messages.rpcFunction(reader.uint32)
    }

    function writeSharedObject(writer, sharedObject){
      writer.uint32(sharedObject.ref)
      writer.string(JSON.stringify(sharedObject.properties))
    }

    function readSharedObject(reader){
      return Messages.rpcSharedObject(reader.uint32(), JSON.parse(reader.string()))
    }

    function writeMessage(writer, message){
      writer.uint8(MessageTypeCodes.value(message.type))
      switch (message.type) {
        case Messages.Types.Init:
          writeInit(writer, message)
          break
        case Messages.Types.Batch:
          writeBatch(writer, message)
          break
        default:
          throw new Error(`unknown message type ${message.type}`)
      }
    }

    function readMessage(reader) {
      switch (MessageTypeCodes.name(reader.uint8())) {
        case Messages.Types.Init:
          return readInit(reader)
        case Messages.Types.Batch:
          return readBatch(reader);
        default:
          throw new Error(`unknown message type ${value.type}`)
      }
    }

    // function serializeSingleBuffer(value) {
    //   const sizeWriter = DataWriter(BufferSizeWriter())
    //   writeMessage(sizeWriter, value)
    //   const buffer = new ArrayBuffer(sizeWriter.size())
    //   const writer = DataWriter(BufferWriter(buffer))
    //   writeMessage(writer, value)
    //   return buffer
    // }
    //
    // function deserializeSingleBuffer(buffer) {
    //   const reader = DataReader(BufferReader(buffer))
    //   return readMessage(reader)
    // }
    //
    // function serialize(value) {
    //   const writer = DataWriter(SerialBufferWriter())
    //   writeMessage(writer, value)
    //   if(monitor)
    //     monitor.bufferAllocation(writer.size(), writer.available())
    //
    //   return writer.buffers
    // }
    //
    // function deserialize(value) {
    //   const reader = DataReader(SerialBufferReader(value))
    //   return readMessage(reader)
    // }

    // return {serialize: serializeSingleBuffer, deserialize: deserializeSingleBuffer}
    // return {serialize, deserialize}
    return {writeMessage, readMessage}
  }

  function BinarySingleBufferSerializer(valueSerializers, monitor) {
    const serializer = BinarySerializer(valueSerializers, monitor)

    serializer.serialize = value => {
      const sizeWriter = DataWriter(BufferSizeWriter())
      serializer.writeMessage(sizeWriter, value)
      const buffer = new ArrayBuffer(sizeWriter.size())
      const writer = DataWriter(BufferWriter(buffer))
      serializer.writeMessage(writer, value)
      return buffer
    }

    serializer.deserialize = buffer => {
      const reader = DataReader(BufferReader(buffer))
      return serializer.readMessage(reader)
    }

    return serializer
  }

  function BinaryMultiBufferSerializer(valueSerializers, monitor) {
    const serializer = BinarySerializer(valueSerializers, monitor)

    serializer.serialize = value => {
      const writer = DataWriter(SerialBufferWriter())
      serializer.writeMessage(writer, value)
      if(monitor)
        monitor.bufferAllocation(writer.size(), writer.available())

      return writer.buffers
    }

    serializer.deserialize = buffers => {
      const reader = DataReader(SerialBufferReader(buffers))
      return serializer.readMessage(reader)
    }

    return serializer
  }

  return {BinarySingleBufferSerializer, BinaryMultiBufferSerializer}
})