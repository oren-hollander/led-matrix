'use strict'

define(['./buffer'], ({SerialBufferReader, SerialBufferWriter}) => {

  const getProtocolName = protocol => {
    if(typeof protocol === 'string')
      return protocol
    else
      return _.keys(protocol)[0]
  }

  function encodeEnum(value, enumValues) {
    return enumValues.findIndex((v => v === value))
  }

  function decodeEnum(value, enumValues) {
    return enumValues[value]
  }

  function protocolCodec(protocols) {

    const getProtocol = protocolName => {
      return protocols[protocolName]
    }

    const read = (protocolName, buffers) => {
      const reader = SerialBufferReader(buffers)

      function readValue(protocol) {
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
            return reader[protocolName]()
          case 'string':
            const stringLength = reader.uint32()
            let string = ''
            for (let i = 0; i < stringLength; i++) {
              string += String.fromCharCode(reader.uint16())
            }
            return string
          case 'ascii':
            const asciiLength = reader.uint32()
            let ascii = ''
            for(let i = 0; i < asciiLength; i++) {
              ascii += String.fromCharCode(reader.uint8())
            }
            return ascii
          case 'json':
            var json = readValue('string')
            if(json === '')
              return undefined
            return JSON.parse(json)
          case 'array':
            return _.map(new Array(reader.uint16()), _.unary(_.partial(readValue, protocol.array)))
          case 'tuple':
            return _.map(protocol.tuple, readValue)
          case 'varargs':
            return _.map(new Array(reader.uint8()), (u, i) => readValue(protocol.varargs[Math.min(i, protocol.varargs.length - 1)]))
          case 'enum':
            const enumValues = protocol.enum
            return decodeEnum(reader.uint8(), enumValues)
          case 'struct':
            return _.mapValues(protocol.struct, (v, key) => readValue(protocol.struct[key]))
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
            const tagCode = reader.peekUint8()
            const tagValue = decodeEnum(tagCode, tagValues)
            const caseProtocol = protocol.union.cases[tagValue]
            return readValue(caseProtocol)
          case 'protocol':
            const v = readValue(readValue('ascii'))
            return v
          default:
            return readValue(getProtocol(protocolName))
        }
      }

      return readValue(getProtocol(protocolName))
    }

    const toChatCode = ch => ch.charCodeAt(0)

    const write = (protocolName, value) => {
      const writer = SerialBufferWriter()

      function writeValue(protocol, value){
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
            writer[protocolName](value)
            break
          case 'string':
            value = value || '' // todo check why shouldn't leave undefined
            writer.uint32(value.length)
            _(value).map(toChatCode).forEach(writer.uint16)
            break
          case 'ascii':
            value = value || '' // todo check why shouldn't leave undefined
            writer.uint32(value.length)
            _(value).map(toChatCode).forEach(writer.uint8)
            break
          case 'json':
            writeValue('string', JSON.stringify(value))
            break
          case 'array':
            if(value.length > 65535)
              throw 'Array too large'
            writer.uint16(value.length)
            _.forEach(value, _.partial(writeValue, protocol.array))
            break
          case 'tuple':
            _.forEach(protocol.tuple, (elementProtocol, i) => {
              writeValue(elementProtocol, value[i])
            })
            break
          case 'varargs':
            if(value.length > 255)
              throw 'Array too large'
            writer.uint8(value.length)
            _.forEach(value, (element, i) => {
              writeValue(protocol.varargs[Math.min(i, protocol.varargs.length - 1)], value[i])
            })
            break
          case 'enum':
            writer.uint8(encodeEnum(value, protocol.enum))
            break
          case 'struct':
            _(protocol.struct)
              .keys()
              .forEach(key => {
                writeValue(protocol.struct[key], value[key])
              })
            break
          case 'union':
            const tag = protocol.union.tag
            const unionCase = value[tag]
            const caseProtocol = protocol.union.cases[unionCase]
            writeValue(caseProtocol, value)
            break
          case 'protocol':
            writeValue('ascii', value.protocol)
            writeValue(value.protocol, value.value)
            break
          default:
            writeValue(getProtocol(protocolName), value)
        }
      }

      writeValue(getProtocol(protocolName), value)

      return writer.buffers
    }

    return {read, write}
  }

  return protocolCodec
})