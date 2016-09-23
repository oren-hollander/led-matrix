'use strict'

define(['./buffer', '../rpc/messages'], ({BufferReader, BufferWriter}, {messageProtocol}) => {

  const getProtocolName = protocol => {
    if(typeof protocol === 'string')
      return protocol
    else
      return Object.keys(protocol)[0]
  }

  // function compile(protocolDef) {
  //   const protocol = {}
  //
  //   const rootProtocolName = getProtocolName(protocolDef)
  //
  //   const getProtocol = protocolName => {
  //     return protocolDef[rootProtocolName][protocolName]
  //   }
  //
  //   function append(protocol, protocolName) {
  //     protocol[protocolName] = protocolDef
  //   }
  //
  //   append(protocol, rootProtocolName)
  //
  //   return protocol
  // }

  function encodeEnum(value, enumValues) {
    return enumValues.findIndex((v => v === value))
  }

  function decodeEnum(value, enumValues) {
    return enumValues[value]
  }

  function protocolCodec(protocol) {

    const rootProtocolName = getProtocolName(protocol)

    const getProtocol = protocolName => {
      return protocol[rootProtocolName][protocolName]
    }

    const read = buf => {
      const reader = BufferReader(buf)

      function readFromBuffer(protocol) {
        const protocolName = getProtocolName(protocol)
        switch (protocolName) {
          case 'uint8':
          case 'uint16':
          case 'uint32':
          case 'int8':
          case 'int16':
          case 'int32':
          case 'float32':
          case 'float64':
          case 'string':
            return reader[protocolName]()
          case 'array':
            const elementProtocol = protocol.array
            const length = reader.uint16()
            const array = []
            for (let i = 0; i < length; i++) {
              array.push(readFromBuffer(elementProtocol))
            }
            return array
          case 'enum':
            const enumValues = protocol.enum
            return decodeEnum(reader.uint8(), enumValues)
          case 'struct':
            const struct = {}
            Object.keys(protocol.struct).forEach(key => {
              const fieldProtocol = protocol.struct[key]
              struct[key] = readFromBuffer(fieldProtocol)
            })
            return struct
          case 'union':
            const tag = protocol.union.tag
            const firstTagValue = Object.keys(protocol.union.cases)[0]
            let firstCaseProtocol = protocol.union.cases[firstTagValue]
            if(typeof firstCaseProtocol === 'string'){
              firstCaseProtocol = getProtocol(firstCaseProtocol)
            }
            let tagProtocol = firstCaseProtocol.struct[tag]
            if(typeof tagProtocol === 'string')
              tagProtocol = getProtocol(tagProtocol)

            const tagValues = tagProtocol.enum
            const tagCode = reader.peek(reader.uint8)()
            const tagValue = decodeEnum(tagCode, tagValues)
            const caseProtocol = protocol.union.cases[tagValue]
            return readFromBuffer(caseProtocol)
          default:
            return readFromBuffer(getProtocol(protocolName))
        }
      }

      return readFromBuffer(getProtocol(rootProtocolName))
    }

    const write = (buf, value) => {
      const writer = BufferWriter(buf)

      function writeToBuffer(protocol, value) {
        const protocolName = getProtocolName(protocol)
        switch (protocolName) {
          case 'uint8':
          case 'uint16':
          case 'uint32':
          case 'int8':
          case 'int16':
          case 'int32':
          case 'float32':
          case 'float64':
          case 'string':
            writer[protocolName](value)
            break
          case 'array':
            const elementProtocol = protocol.array
            writer.uint16(value.length)
            for (let i = 0; i < value.length; i++) {
              writeToBuffer(elementProtocol, value[i])
            }
            break
          case 'enum':
            const enumValues = protocol.enum
            writer.uint8(encodeEnum(value,enumValues))
            break
          case 'struct':
            Object.keys(protocol.struct).forEach(key => {
              const fieldProtocol = protocol.struct[key]
              writeToBuffer(fieldProtocol, value[key])
            })
            break
          case 'union':
            const tag = protocol.union.tag
            const unionCase = value[tag]
            const caseProtocol = protocol.union.cases[unionCase]
            writeToBuffer(caseProtocol, value)
            break
          default:
            writeToBuffer(getProtocol(protocolName), value)
        }
      }

      writeToBuffer(getProtocol(rootProtocolName), value)
    }

    return {read, write}
  }

  const {read, write} = protocolCodec(messageProtocol)
  const buf = new ArrayBuffer(1024 * 64)

  const message = {type: 'batch', rpcMessages: [
    {
      type: 'call',
      id: 1,
      stub: 345,
      func: 'myFunc',
      args: [
        {
          type: 'data-value',
          data: 'some json'
        },
        {
          type: 'api-value',
          api: ['a', 'b'],
          stub: 123
        }
      ],
      returnPriority: 'immediate'
    },
    {
      type: 'return',
      id: 1,
      stub: 345,
      value: {
        type: 'data-value',
        data: '52'
      }
    },
    {
      type: 'error',
      id: 1,
      stub: 345,
      error: 'err'
    },


  ]}
  write(buf, message)
  const m = read(buf)
})