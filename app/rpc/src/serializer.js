'use strict'

define(['lodash', 'annotations', 'messages', 'priority', './buffer/proto-buf', './buffer/buffer', 'enum'], (_,
  {Annotations, annotate, getAnnotation, getAnnotations}, Messages, {MessagePriorities}, protocolCodec,
  {SerialBufferWriter, SerialBufferReader}, Enum) => {


  function MessageSerializerAdapter(serializer) {
    return {
      serialize: value => {
        const buffers = serializer.serialize(value)
        return {message: {buffers}, transferList: buffers}
      },
      deserialize: value => serializer.deserialize(value.buffers)
    }
  }

  const JsonMessageSerializer = {
    serialize: value => ({message: JSON.stringify(value), transferList: []}),
    deserialize: value => JSON.parse(value)
  }

  const NativeMessageSerializer = {
    serialize: value => ({message: value, transferList: []}),
    deserialize: value => value
  }

  function ProtoBufMessageSerializer() {

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

  const toChatCode = ch => ch.charCodeAt(0)

  function DataWriter(serialWriter) {
    const stringWriter = {
      string: s => {
        serialWriter.uint32(s.length)
        _(s).map(toChatCode).forEach(serialWriter.uint16)
      },
      ascii: s => {
        serialWriter.uint32(s.length)
        _(s).map(toChatCode).forEach(serialWriter.uint8)
      }
    }

    return _.assign(stringWriter, serialWriter)
  }

  function DataReader(serialReader) {
    const stringReader = {
      string: () => {
        const length = serialReader.uint32()
        let string = ''
        for (let i = 0; i < length; i++) {
          string += String.fromCharCode(serialReader.uint16())
        }
        return string
      },
      ascii: () => {
        const length = serialReader.uint32()
        let string = ''
        for (let i = 0; i < length; i++) {
          string += String.fromCharCode(serialReader.uint8())
        }
        return string
      }
    }

    return _.assign(stringReader, serialReader)
  }

  function ObjectWriter(dataWriter, serializerRegistry) {
    const objectWriter = {
      object: o => {
        const serializerName = getAnnotation(o, Annotations.Serialized) || 'JSON'
        const serializer = serializerRegistry.getSerializerByName(serializerName)
        objectWriter.uint16(serializerRegistry.getSerializerId(serializerName))
        serializer.write(objectWriter, o)
      }
    }
    return _.assign(objectWriter, dataWriter)
  }

  function ObjectReader(dataReader, serializerRegistry) {
    const objectReader = {
      object: () => {
        const serializerId = objectReader.uint16()
        const serializer = serializerRegistry.getSerializerById(serializerId)
        return serializer.read(objectReader)
      }
    }

    return _.assign(objectReader, dataReader)
  }

  const JsonSerializer = {
    write: (writer, value) => {
      writer.string(JSON.stringify(value))
    },
    read: reader => {
      return JSON.parse(reader.string())
    }
  }

  const InitMessageSerializer = {
    write: (writer, value) => {
      writer.uint32(value.api.length)
      _.forEach(value.api, writer.string)
    },
    read: reader => {
      const length = reader.uint32()
      const api = new Array(length)
      for(let i = 0; i < length; i++){
        api[i] = reader.string()
      }

      return {
        type: Messages.Types.Init,
        api
      }
    }
  }

  const BatchMessageSerializer = {
    write: (writer, value) => {
      writer.uint32(value.rpcMessages.length)
      _.forEach(value.rpcMessages, writer.object)
    },
    read: reader => {
      const length = reader.uint32()
      const rpcMessages = new Array(length)
      for(let i = 0; i < length; i++){
        rpcMessages[i] = reader.object()
      }

      return {
        type: Messages.Types.Batch,
        rpcMessages
      }
    }
  }

  const Priorities = Enum([
    MessagePriorities.Immediate,
    MessagePriorities.High,
    MessagePriorities.Medium,
    MessagePriorities.Low,
    MessagePriorities.None
  ])

  const RpcValueSerializer = {
    write: (writer, value) => {
      writer.object(value.value)
    },
    read: reader => {
      return {
        type: Messages.Types.Value,
        value: reader.object()
      }
    }
  }

  const RpcApiCallSerializer = {
    write: (writer, value) => {
      writer.uint32(value.id)
      writer.uint32(value.stub)
      writer.string(value.func)
      writer.uint16(value.args.length)
      _.forEach(value.args, writer.object)
      writer.uint8(Priorities.value(value.returnPriority))
    },
    read: reader => {
      const id = reader.uint32()
      const stub = reader.uint32()
      const func = reader.string()
      const argLength = reader.uint16()
      const args = new Array(argLength)
      for (let i = 0; i < argLength; i++){
        args[i] = reader.object()
      }
      const returnPriority = Priorities.name(reader.uint8())
      return {type: Messages.Types.ApiCall, id, stub, func, args, returnPriority}
    }
  }

  // const RpcFunctionCallSerializer = (argSerializers) => ({
  //   write: (writer, value) => {
  //     writer.uint32(value.stub)
  //     writer.uint16(args.length)
  //     _(value.args).take(argSerializers.length).zip(argSerializers).forEach(([arg, serializer]) => {
  //       serializer.write(writer, arg)
  //     })
  //     _(value.args).drop(argSerializers.length).forEach(_.partial(_.last(argSerializers).write, writer))
  //   },
  //   read: reader => {
  //     const stub = reader.uint32()
  //     const argLength = reader.uint16()
  //     const args = new Array(argLength)
  //     for (let i = 0; i < argLength; i++){
  //       args[i] = argSerializers[Math.min(i, argSerializers.length - 1)].read(reader)
  //     }
  //     return {stub, args}
  //   }
  // })
  //
  // const RpcValueArgSerializer = {
  //   read: reader => {},
  //   write: (writer, value) => {
  //     // get arg
  //   }
  // }
  //
  // const RpcMessageTypes = [
  //   Messages.Types.ApiCall,
  //   Messages.Types.FunctionCall,
  //   Messages.Types.Return,
  //   Messages.Types.Error,
  //   Messages.Types.StubPropertyUpdate,
  //   Messages.Types.ProxyPropertyUpdate
  // ]

  // const RpcMessageSerializer = {
  //   read: reader => {
  //     const type = RpcMessageTypes[reader.peekUint8()]
  //     switch(type){
  //       case Messages.Types.ApiCall:
  //         return RpcApiCallSerializer.read(reader)
  //       case Messages.Types.FunctionCall:
  //         return RpcFunctionCallSerializer.read(reader)
  //       case Messages.Types.Return:
  //         return RpcReturnSerializer.read(reader)
  //       case Messages.Types.Error:
  //         return RpcErrorSerializer.read(reader)
  //       case Messages.Types.StubPropertyUpdate:
  //         return RpcStubPropertyUpdateSerializer.read(reader)
  //       case Messages.Types.ProxyPropertyUpdate:
  //         return RpcProxyPropertyUpdateSerializer.read(reader)
  //       default:
  //         throw `Unknown RPC message type: ${type}`
  //     }
  //   },
  //   write: (writer, value) => {
  //     writer.uint8(_.indexOf(RpcMessageTypes, value.type))
  //     switch(value.type){
  //       case Messages.Types.ApiCall:
  //         RpcApiCallSerializer.write(writer, value)
  //         break
  //       case Messages.Types.FunctionCall:
  //         RpcFunctionCallSerializer.write(writer, value)
  //         break
  //       case Messages.Types.Return:
  //         RpcReturnSerializer.write(writer, value)
  //         break
  //       case Messages.Types.Error:
  //         RpcErrorSerializer.write(writer, value)
  //         break
  //       case Messages.Types.StubPropertyUpdate:
  //         RpcStubPropertyUpdateSerializer.write(writer, value)
  //         break
  //       case Messages.Types.ProxyPropertyUpdate:
  //         RpcProxyPropertyUpdateSerializer.write(writer, value)
  //         break
  //       default:
  //         throw `Unknown RPC message type: ${type}`
  //     }
  //   }
  // }

  // const MessageTypes = [Messages.Types.Init, Messages.Types.Batch]

  // const MessageSerializer = {
  //   read: reader => {
  //     const type = MessageTypes[reader.uint8()]
  //     switch(type) {
  //       case Messages.Types.Init:
  //         const api = _.map(new Array(reader.uint8()), () => reader.string)
  //         return {type, api}
  //       case Messages.Types.Batch:
  //         const rpcMessages = _.map(new Array(reader.uint16()), _.partial(RpcMessageSerializer.read, reader))
  //         return {type, rpcMessages}
  //       default:
  //         throw `Unknown message type: ${type}`
  //     }
  //   },
  //   write: (writer, value) => {
  //     writer.uint8(_.indexOf(MessageTypes, value.type))
  //     switch(type){
  //       case Messages.Types.Init:
  //         writer.uint8(value.api.length)
  //         _.forEach(value.api, writer.string)
  //         break
  //       case Messages.Types.Batch:
  //         writer.uint16(value.rpcMessages.length)
  //         _.forEach(value.rpcMessages, _.partial(RpcMessageSerializer.write, writer))
  //         break
  //       default:
  //         throw `Unknown message type: ${type}`
  //     }
  //   }
  // }

  // serialize: value => ({message: JSON.stringify(value), transferList: []}),
  //   deserialize: value => JSON.parse(value)

  function CustomMessageSerializer(serializerRegistry) {

    return {
      serialize: value => {
        const objectWriter = ObjectWriter(DataWriter(SerialBufferWriter(() => 100000)), serializerRegistry)
        objectWriter.object(value)
        return objectWriter.buffers
      },

      deserialize: buffers => {
        const objectReader = ObjectReader(DataReader(SerialBufferReader(buffers)), serializerRegistry)
        return objectReader.object()
      }
    }
  }


  return {CustomMessageSerializer, JsonSerializer, InitMessageSerializer, RpcValueSerializer, BatchMessageSerializer, RpcApiCallSerializer, NativeMessageSerializer, MessageSerializerAdapter, JsonMessageSerializer}
})