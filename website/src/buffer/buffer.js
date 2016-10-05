'use strict'

define([
  'lodash'
], (
  _
) => {

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

    const peek = readFunction => () => {
      const currentOffset = offset
      const result = readFunction()
      offset = currentOffset
      return result
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, peek}
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

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64}
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

  return {BufferReader, BufferWriter, Size}
})