'use strict'

define(['lodash'], (_) => {

  const linearGrowth = size => () => size

  const primitives = {
    uint8: 1,
    uint16: 2,
    uint32: 4,
    int8: 1,
    int16: 2,
    int32: 4,
    float32: 4,
    float64: 8
  }

  const setter = primitive => {
    return 'set' + primitive.charAt(0).toUpperCase() + primitive.substring(1)
  }

  const getter = primitive => {
    return 'get' + primitive.charAt(0).toUpperCase() + primitive.substring(1)
  }

  const peeker = primitive => {
    return 'peek' + primitive.charAt(0).toUpperCase() + primitive.substring(1)
  }

  function SerialBufferWriter(growth = linearGrowth(256)) {

    const buffers = []
    let offset
    let view
    let size = 0

    const available = () => view ? view.byteLength - offset : 0

    function ensureSpace(requiredSize){
      if(available() < requiredSize){
        const bufSize = growth(size)
        size += bufSize
        const buf = new ArrayBuffer(bufSize)
        buffers.push(buf)
        view = new DataView(buf)
        offset = 0
      }
    }

    return _(primitives)
      .mapValues((size, primitive) => value => {
        ensureSpace(size)
        view[setter(primitive)](offset, value)
        offset += size
      })
      .assign({buffers})
      .value()
  }

  function SerialBufferReader(buffers) {

    let bufferIndex = 0
    let view = new DataView(buffers[0])
    let offset = 0

    const available = () => view.byteLength - offset

    function ensureSpace(requiredSize){
      if(available() < requiredSize){
        bufferIndex++
        view = new DataView(buffers[bufferIndex])
        offset = 0
      }
    }

    const peeks = _(primitives)
      .mapValues((size, primitive) => () => {
        if(available() >= size){
          return view[getter(primitive)](offset)
        }
        else {
          return new DataView(buffers[bufferIndex + 1])[getter(primitive)](0)
        }
      })
      .mapKeys(_.rearg(peeker, 1))
      .value()

    return _(primitives)
      .mapValues((size, primitive) => () => {
        ensureSpace(size)
        var value = view[getter(primitive)](offset)
        offset += size
        return value
      })
      .assign(peeks)
      .value()
  }

  function BufferReader(buf) {

    const view = new DataView(buf)
    let offset = 0

    const uint8 = () => {
      const r = view.getUint8(offset)
      offset += Size.uint8
      return r
    }

    const uint16 = () => {
      const r = view.getUint16(offset)
      offset += Size.uint16
      return r
    }

    const uint32 = () => {
      const r = view.getUint32(offset)
      offset += Size.uint32
      return r
    }

    const int8 = () => {
      const r = view.getInt8(offset)
      offset += Size.int8
      return r
    }

    const int16 = () => {
      const r = view.getInt16(offset)
      offset += Size.int16
      return r
    }

    const int32 = () => {
      const r = view.getInt32(offset)
      offset += Size.int32
      return r
    }

    const float32 = () => {
      const r = view.getFloat32(offset)
      offset += Size.float32
      return r
    }

    const float64 = () => {
      const r = view.getFloat64(offset)
      offset += Size.float64
      return r
    }

    const string = () => {
      const length = uint32()
      let str = ''
      for(let i = 0; i < length; i++) {
        str += String.fromCharCode(uint16())
      }
      return str
    }

    const ascii = () => {
      const length = uint32()

      let asciiString = ''
      for(let i = 0; i < length; i++) {
        asciiString += String.fromCharCode(uint8())
      }

      return asciiString
    }

    const peek = readFunction => () => {
      const currentOffset = offset
      const result = readFunction()
      offset = currentOffset
      return result
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, string, ascii, peek}
  }

  function BufferWriter(buf) {
    const view = new DataView(buf)
    let offset = 0

    const uint8 = i => {
      view.setUint8(offset, i)
      offset += 1
    }

    const uint16 = i => {
      view.setUint16(offset, i)
      offset += 2
    }

    const uint32 = i => {
      view.setUint32(offset, i)
      offset += 4
    }

    const int8 = i => {
      view.setInt8(offset, i)
      offset += 1
    }

    const int16 = i => {
      view.setInt16(offset, i)
      offset += 2
    }

    const int32 = i => {
      view.setInt32(offset, i)
      offset += 4
    }

    const float32 = f => {
      view.setFloat32(offset, f)
      offset += 4
    }

    const float64 = f => {
      view.setFloat64(offset, f)
      offset += 8
    }

    const string = str => {
      uint32(str.length)
      for (let i = 0; i < str.length; i++) {
        uint16(str.charCodeAt(i))
      }
    }

    const ascii = str => {
      uint32(str.length)
      for (let i = 0; i < str.length; i++) {
        uint8(str.charCodeAt(i))
      }
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, string, ascii}
  }

  const Size = {
    uint8: 1,
    uint16: 2,
    uint32: 4,
    int8: 1,
    int16: 2,
    int32: 4,
    float32: 4,
    float64: 8,
    string: str => Size.uint32 + str.length * Size.uint16,
    ascii: str => Size.uint32 + str.length * Size.uint8
  }

  return {BufferReader, BufferWriter, Size, SerialBufferWriter, SerialBufferReader}
})