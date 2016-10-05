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

    return _.assign(serialWriter, stringWriter)
  }

  function DataReader(serialReader) {
    const stringReader = {
      string: () => {
        const length = serialReader.uint32()
        let chars = new Array(length)
        for (let i = 0; i < length; i++) {
          chars[i] = serialReader.uint16()
        }
        return fastJoin(chars)
      },
      ascii: () => {
        const length = serialReader.uint32()
        let chars = new Array(length)
        for (let i = 0; i < length; i++) {
          chars[i] = serialReader.uint8()
        }
        return fastJoin(chars)
      }
    }

    return _.assign(serialReader, stringReader)
  }

  return {DataWriter, DataReader}
})

