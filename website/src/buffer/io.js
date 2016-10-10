'use strict'

define([], () => {

  const toChatCode = ch => ch.charCodeAt(0)

  function fastJoin(chars) {
    if(chars.length === 0)
      return ''

    function join(l, r){
      if(l === r - 1){
        return String.fromCharCode(chars[l]) + String.fromCharCode(chars[r])
      }
      else if(l === r){
        return String.fromCharCode(chars[l])
      }
      else {
        const h = l + Math.floor(((r - l) / 2))
        return join(l, h - 1) + join(h , r)
      }
    }

    return join(0, chars.length - 1)
  }

  function DataWriter(writer) {
    const stringWriter = {
      string: s => {
        writer.uint32(s.length)
        _(s).map(toChatCode).forEach(writer.uint16)
      },
      ascii: s => {
        writer.uint32(s.length)
        _(s).map(toChatCode).forEach(writer.uint8)
      }
    }

    return _.assign(writer, stringWriter)
  }

  function DataReader(writer) {
    const stringReader = {
      string: () => {
        const length = writer.uint32()
        let chars = new Array(length)
        for (let i = 0; i < length; i++) {
          chars[i] = writer.uint16()
        }
        return fastJoin(chars)
      },
      ascii: () => {
        const length = writer.uint32()
        let chars = new Array(length)
        for (let i = 0; i < length; i++) {
          chars[i] = writer.uint8()
        }
        return fastJoin(chars)
      }
    }

    return _.assign(writer, stringReader)
  }

  return {DataWriter, DataReader}
})

