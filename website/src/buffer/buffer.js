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

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64}
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

  function BufferSizeWriter() {
    let size = 0

    const uint8 = () => {
      size += 1
    }

    const uint16 = () => {
      size += 2
    }

    const uint32 = () => {
      size += 4
    }

    const int8 = () => {
      size += 1
    }

    const int16 = () => {
      size += 2
    }

    const int32 = () => {
      size += 4
    }

    const float32 = () => {
      size += 4
    }

    const float64 = () => {
      size += 8
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, size: () => size}
  }

  return {BufferReader, BufferWriter, BufferSizeWriter}
})