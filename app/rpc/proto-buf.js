'use strict'

define([], () => {

  function string() {
    return {
      name: 'string'
    }
  }

  function json() {

  }

  function uint8() {
    return {
      name: 'uint8'
    }
  }

  function uint16() {
    return {
      name: 'uint16'
    }
  }

  function uint32() {
    return {
      name: 'uint32'
    }
  }

  function int8() {
    return {
      name: 'int8'
    }
  }

  function int16() {
    return {
      name: 'int16'
    }
  }

  function int32() {
    return {
      name: 'int32'
    }
  }

  function float32() {
    return {
      name: 'float32'
    }
  }

  function float64() {
    return {
      name: 'float64'
    }
  }

  function enm(protocol, mappings) {

  }

  function array(elementProtocol) {
    return {
      name: 'array',
      proto: elementProtocol
    }
  }

  function field(name, protocol) {
    return {name, proto: protocol}
  }

  function struct(...fields) {
    return {
      name: 'struct',
      fields
    }
  }

  function unionCase(name, ...fields) {
    return {
      name,
      fields
    }
  }

  function union(tag, ...cases) {
    return {
      name: 'union',
      tag,
      cases
    }
  }

  function BufferReader(buf) {

    const view = new DataView(buf)
    let offset = 0

    const uint8 = () => {
      const r = view.getUint8(offset)
      offset += 2
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
      offset += 2
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

      const r = String.fromCharCode(... new Uint16Array(buf, offset, length))
      offset += length * 2
      return r
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, string}
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

      const arr = new Uint16Array(view.buffer, offset)
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i)
      }
      offset += str.length * 2
    }

    return {uint8, uint16, uint32, int8, int16, int32, float32, float64, string}
  }

  function read(buf, protocol) {
    const reader = BufferReader(buf)

    function readFromBuffer(protocol) {
      // const readerFunction = reader[protocol.name]
      switch (protocol.name){
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'int8':
        case 'int16':
        case 'int32':
        case 'float32':
        case 'float64':
        case 'string':
          return reader[protocol.name]()
        case 'array':
          const length = reader.uint16()
          const arr = []
          for(let i = 0; i < length; i++){
            arr.push(readFromBuffer(protocol.proto))
          }
           return arr
        case 'struct':
          const struct = {}
          protocol.fields.forEach(({name, proto}) => {
            struct[name] = readFromBuffer(proto)
          })
          return struct
        case 'union':
          const tag = protocol.tag
          return reader.string()
      }
    }

    return readFromBuffer(protocol)
  }

  function write(buf, protocol, value) {
    const writer = BufferWriter(buf)

    function writeToBuffer(protocol, value){
      // const writerFunction = writer[protocol.name]
      switch (protocol.name){
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'int8':
        case 'int16':
        case 'int32':
        case 'float32':
        case 'float64':
        case 'string':
          writer[protocol.name](value)
          break
        case 'array':
          writer.uint16(value.length)
          for(let i = 0; i < value.length; i++) {
            writeToBuffer(protocol.proto, value[i])
          }
          break
        case 'struct':
          protocol.fields.forEach(({name, proto}) => {
            writeToBuffer(proto, value[name])
          })
          break
        case 'union':
          const tag = protocol.tag
          const protocolCase = protocol.cases.find(protocolCase => protocolCase.name === value[tag])
          string(value[protocolCase])
          protocolCase.fields.forEach(({name, proto}) => {
            writeToBuffer(proto, value[name])
          })
          break
      }
    }

    writeToBuffer(protocol, value)
  }

  // const buf = new ArrayBuffer(1024)
  // write(buf, uint8(), 42)
  // console.log(read(buf, uint8()))
  //
  // write(buf, string(), 'hello')
  // console.log(read(buf, string()))
  //
  // write(buf, array(string()), ['hello', 'world'])
  // console.log(read(buf, array(string())))
  //
  // write(buf, array(uint32()), [12, 13, 14])
  // console.log(read(buf, array(uint32())))
  //
  // write(buf, array(array(uint32())), [[12], [], [14, 15]])
  // console.log(read(buf, array(array(uint32()))))
  //
  // const structProto = struct(field('str', string()), field('int', uint32()))
  // write(buf, structProto, {str: 'hello', int: 42})
  // console.log(read(buf, structProto))
  //
  // const structProto2 = struct(field('intArray', array(uint32())), field('inner', struct(field('i', uint8()))))
  // write(buf, structProto2, {intArray: [1, 2, 3], inner: {i: 8}})
  // console.log(read(buf, structProto2))
  //
  // const unionProto = union('type', unionCase('s', field('str', string())), unionCase('i', field('int', int32()), field('num', float64())))
  //
  // write(buf, unionProto, {type: 's', str: 'hello'})
  // console.log(JSON.stringify(read(buf, unionProto)))
  //
  // write(buf, unionProto, {type: 'i', int: -42, num: Math.PI})
  // console.log(JSON.stringify(read(buf, unionProto)))


  // const strProto = {
  //   name: 'string'
  // }
  //
  // const intArrayProto = {
  //   name: 'array',
  //   proto: {
  //     name: 'int32'
  //   }
  // }
  //
  // const structProto = {
  //   name: 'struct',
  //   fields: [
  //     {
  //       name: 'one',
  //       proto: {
  //         name: 'string'
  //       }
  //     },
  //     {
  //       name: 'two',
  //       proto: {
  //         name: 'uint16'
  //       }
  //     }
  //   ]
  // }
  //
  // const unionProto = {
  //   name: 'union',
  //   tag: 'type',
  //   cases: [
  //     {
  //       name: 's',
  //       fields: [
  //         {
  //           name: 'str',
  //           proto: {
  //             name: 'string'
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       name: 'i',
  //       fields: [
  //         {
  //           name: 'int',
  //           proto: {
  //             name: 'int32'
  //           }
  //         },
  //         {
  //           name: 'num',
  //           proto: {
  //             name: 'float64'
  //           }
  //         }
  //       ]
  //     }
  //   ]
  // }
  //
  // const proto = {
  //   proto: {
  //     name: 'union',
  //     tag: {
  //       value: 'type',
  //       // proto: {
  //       //   name: 'string'
  //       // },
  //       proto: {
  //         name: 'mapper',
  //         proto: {
  //           name: 'unit8'
  //         },
  //         mapping: {
  //           s: 0,
  //           i: 1
  //         }
  //       }
  //     },
  //     cases: [
  //       {
  //         tagValue: 's',
  //         proto: {
  //           name: 'union',
  //           fields: [
  //             {
  //               proto: {
  //                 name: 'string'
  //               },
  //               name: 'str'
  //             }
  //           ]
  //         }
  //       },
  //       {
  //         tagValue: 'i',
  //         proto: {
  //           name: 'uint32'
  //         }
  //       }
  //     ]
  //   }
  // }
  //
  // const typeMapper = mapper(uint8(), {'s': 0, 'i': 1})
  // const protocol = ProtocolBuilder().uint32().build()
  //
  // const protocol1 = union(
  //   field('type', typeMapper),
  //   unionCase('s', struct(
  //     field('str', string())
  //   )),
  //   unionCase('i', struct(
  //     field('int', uint32()),
  //     field('num', float64())
  //   )))
  //
  // const protocol2 = union('type',
  //   unionCase('st', struct(
  //     field('a', uint32()),
  //     field('b', string())
  //   )),
  //   unionCase('i', uint32()))
  //
  // const protocol3 = string()
  //
  // const buf = new ArrayBuffer(1024)
  // write(buf, protocol, 13)
  // const value = read(buf, protocol)
  //
  // console.log(value)
})

// const proto = {enum: ()=>{}, string, uint16}

const protoBufJson = {
  myEnum: {
    'enum': ['type1', 'type2']
  },
  myString: 'string',
  myUint16: 'uint16',
  myArrayOfArrayOfString: {array: {array: 'string'}},
  myArrayOfBytes: {array: 'uint8'},
  myArrayOfArrayOfByte: {array: 'myArrayOfBytes'},
  myStruct: {
    struct: {
      myString: 'string',
      myNum: 'float32'
    }
  },
  mySecondStruct: {
    struct: {
      myType: 'myEnum',
      myInnerStruct: 'myStruct'
    }
  },
  myUnion: {
    union: {
      type1: {
        struct: {
          myType: 'myEnum',
          myStr: 'string'
        }
      },
      type2: {
        struct: {
          myType: 'myEnum',
          myInt: 'int32',
          myNum: 'float64'
        }
      }
    }
  }
}

// const protoBuf = {
//   type: protoEnum('type-1', 'type-2'),
//   str: protoString(),
//   int: protoUint16(),
//   myStruct: protoStruct()
// }