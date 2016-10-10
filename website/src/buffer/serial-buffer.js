'use strict'

define([], () => {

  const linearGrowth = size => () => size
  const exponentialGrowth = (min, max, factor) => size => Math.max(min, Math.min(size * factor, max))

  function SerialBufferWriter(growth = exponentialGrowth(1024, 65536, 2)) {

    const buffers = []
    let offset
    let view
    let size = 0

    const available = () => view ? view.byteLength - offset : 0

    function ensureSpace(requiredSize) {
      if (available() < requiredSize) {
        const bufSize = growth(size)
        size += bufSize
        const buf = new ArrayBuffer(bufSize)
        buffers.push(buf)
        view = new DataView(buf)
        offset = 0
      }
    }

    return {
      uint8: value => {
        ensureSpace(1)
        view.setUint8(offset, value)
        offset += 1
      },
      uint16: value => {
        ensureSpace(2)
        view.setUint16(offset, value)
        offset += 2
      },
      uint32: value => {
        ensureSpace(4)
        view.setUint32(offset, value)
        offset += 4
      },
      int8: value => {
        ensureSpace(1)
        view.setInt8(offset, value)
        offset += 1
      },
      int16: value => {
        ensureSpace(2)
        view.setInt16(offset, value)
        offset += 2
      },
      int32: value => {
        ensureSpace(4)
        view.setInt32(offset, value)
        offset += 4
      },
      float32: value => {
        ensureSpace(4)
        view.setFloat32(offset, value)
        offset += 4
      },
      float64: value => {
        ensureSpace(8)
        view.setFloat64(offset, value)
        offset += 8
      },
      buffers,
      available,
      size: () => size
    }
  }

  function SerialBufferReader(buffers) {

    let bufferIndex = 0
    let view = new DataView(buffers[0])
    let offset = 0

    const available = () => view.byteLength - offset

    function ensureSpace(requiredSize) {
      if (available() < requiredSize) {
        bufferIndex++
        view = new DataView(buffers[bufferIndex])
        offset = 0
      }
    }

    return {
      uint8: () => {
        ensureSpace(1)
        var value = view.getUint8(offset)
        offset += 1
        return value
      },
      uint16: () => {
        ensureSpace(2)
        var value = view.getUint16(offset)
        offset += 2
        return value
      },
      uint32: () => {
        ensureSpace(4)
        var value = view.getUint32(offset)
        offset += 4
        return value
      },
      int8: () => {
        ensureSpace(1)
        var value = view.getInt8(offset)
        offset += 1
        return value
      },
      int16: () => {
        ensureSpace(2)
        var value = view.getInt16(offset)
        offset += 2
        return value
      },
      int32: () => {
        ensureSpace(4)
        var value = view.getInt32(offset)
        offset += 4
        return value
      },
      float32: () => {
        ensureSpace(4)
        var value = view.getFloat32(offset)
        offset += 4
        return value
      },
      float64: () => {
        ensureSpace(8)
        var value = view.getFloat64(offset)
        offset += 8
        return value
      }
    }
  }

  return {SerialBufferWriter, SerialBufferReader, linearGrowth, exponentialGrowth}
})
