'use strict'

define([], () => {

  function BufferReader(buf) {

    const view = new DataView(buf)
    let offset = 0

    const uint8 = () => {
      const r = view.getUint8(offset)
      offset += 1
      return r
    }

    const uint16 = () => {
      const r = view.getUint16(offset)
      offset += 2
      return r
    }

    const uint32 = () => {
      const r = view.getUint32(offset)
      offset += 4
      return r
    }

    const int8 = () => {
      const r = view.getInt8(offset)
      offset += 1
      return r
    }

    const int16 = () => {
      const r = view.getInt16(offset)
      offset += 2
      return r
    }

    const int32 = () => {
      const r = view.getInt32(offset)
      offset += 4
      return r
    }

    const float32 = () => {
      const r = view.getFloat32(offset)
      offset += 4
      return r
    }

    const float64 = () => {
      const r = view.getFloat64(offset)
      offset += 8
      return r
    }

    const string = () => {
      const length = uint16()
      const charCodes = new Array(length)
      for(let i = 0; i < length; i++) {
        charCodes[i] = view.getUint16(offset)
        offset += 2
      }
      return String.fromCharCode(... charCodes)
    }

    const peek = readFunction => () => {
      const currentOffset = offset
      const result = readFunction()
      offset = currentOffset
      return result
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, string, peek}
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
      uint16(str.length)

      for (let i = 0; i < str.length; i++) {
        view.setUint16(offset, str.charCodeAt(i))
        offset += 2
      }
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, string}
  }

  return {BufferReader, BufferWriter}
})