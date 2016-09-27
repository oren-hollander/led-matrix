'use strict'

define(['./buffer'], ({BufferReader, BufferWriter}) => {

  const getProtocolName = protocol => {
    if(typeof protocol === 'string')
      return protocol
    else
      return Object.keys(protocol)[0]
  }

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
          case 'json':
            var json = readFromBuffer('string');
            if(json === '')
              return undefined
            return JSON.parse(json)
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

    function collect(value) {
      const primitives = []
      let size = 0

      const primitive = (writeFunc, value) => ({writeFunc, value})

      function collectValue(protocol, value){
        const protocolName = getProtocolName(protocol)
        switch (protocolName) {
          case 'uint8':
            primitives.push(primitive(protocolName, value))
            size += 1
            break
          case 'uint16':
            primitives.push(primitive(protocolName, value))
            size += 2
            break
          case 'uint32':
            primitives.push(primitive(protocolName, value))
            size += 4
            break
          case 'int8':
            primitives.push(primitive(protocolName, value))
            size += 1
            break
          case 'int16':
            primitives.push(primitive(protocolName, value))
            size += 2
            break
          case 'int32':
            primitives.push(primitive(protocolName, value))
            size += 4
            break
          case 'float32':
            primitives.push(primitive(protocolName, value))
            size += 4
            break
          case 'float64':
            primitives.push(primitive(protocolName, value))
            size += 8
            break
          case 'string':
            value = value || ''
            primitives.push(primitive(protocolName, value))
            size += 2 + value.length * 2
            break
          case 'json':
            collectValue('string', JSON.stringify(value))
            break
          case 'array':
            const elementProtocol = protocol.array
            primitives.push(primitive('uint16', value.length))
            size += 2
            for (let i = 0; i < value.length; i++) {
              collectValue(elementProtocol, value[i])
            }
            break
          case 'enum':
            const enumValues = protocol.enum
            size += 1
            primitives.push(primitive('uint8', encodeEnum(value, enumValues)))
            break
          case 'struct':
            Object.keys(protocol.struct).forEach(key => {
              const fieldProtocol = protocol.struct[key]
              collectValue(fieldProtocol, value[key])
            })
            break
          case 'union':
            const tag = protocol.union.tag
            const unionCase = value[tag]
            const caseProtocol = protocol.union.cases[unionCase]
            collectValue(caseProtocol, value)
            break
          default:
            collectValue(getProtocol(protocolName), value)
        }
      }

      collectValue(getProtocol(rootProtocolName), value)
      return {primitives, size}
    }

    const write = (value) => {
      const {primitives, size} = collect(value)
      const buf = new ArrayBuffer(size)
      const writer = BufferWriter(buf)
      primitives.forEach(({writeFunc, value}) => {
        writer[writeFunc](value)
      })

      return buf
    }

    return {read, write}
  }

  return protocolCodec
})