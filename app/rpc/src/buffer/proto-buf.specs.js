'use strict'

define(['lodash', './proto-buf'], (_, protocolCodec) => {

  describe('Protocol Buffers', function () {
    it('int8', function () {
      const protocol = {myInt: 'int8'}
      const {read, write} = protocolCodec(protocol)
      const buf = write('myInt', -3)
      const myInt = read('myInt', buf)
      expect(myInt).toEqual(-3)
    })

    it('struct', function () {
      const protocol = {
        myStruct: {
          struct: {
            s: 'string',
            i: 'uint32'
          }
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write('myStruct', {s: 'hello', i: 54})
      const myStruct = read('myStruct', buf)
      expect(myStruct).toEqual({s: 'hello', i: 54})
    })

    it('array', function () {
      const protocol = {
        myArray: {
          array: 'string'
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write('myArray', ['hello', 'hi'])
      const myArray = read('myArray', buf)
      expect(myArray).toEqual(['hello', 'hi'])
    })

    it('tuple', function () {
      const protocol = {
        myTuple: {
          tuple: ['string', 'uint32']
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write('myTuple', ['hello', 54])
      const myTuple = read('myTuple', buf)
      expect(myTuple).toEqual(['hello', 54])
    })

    it('variable length tuple', function () {
      const protocol = {
        myVarargs: {
          varargs: ['string', 'uint32']
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write('myVarargs', ['hello', 10, 20, 30])
      const myVarargs = read('myVarargs', buf)
      expect(myVarargs).toEqual(['hello', 10, 20, 30])
    })

    it('union', function () {
      const protocol = {
        myUnion: {
          union: {
            tag: 't',
            cases: {
              a: {
                struct: {
                  t: {
                    enum: ['a', 'b']
                  },
                  s: 'string'
                }
              },
              b: {
                struct: {
                  t: {
                    enum: ['a', 'b']
                  },
                  n: 'int16'
                }
              }
            }
          }
        }
      }

      const {read, write} = protocolCodec(protocol)
      const buf1 = write('myUnion', {t: 'a', s: 'hello'})
      const buf2 = write('myUnion', {t: 'b', n: -42})
      const myUnion1 = read('myUnion', buf1)
      const myUnion2 = read('myUnion', buf2)
      expect(myUnion1).toEqual({t: 'a', s: 'hello'})
      expect(myUnion2).toEqual({t: 'b', n: -42})
    })

    it('dynamic protocols', function () {
      const protocol = {
        messageType: {
          enum: ['function', 'return']
        },
        myDynamicProtocol: {
          union: {
            tag: 'type',
            cases: {
              function: {
                struct: {
                  type: 'messageType',
                  func: 'string',
                  args: 'protocol'
                }
              },
              return: {
                struct: {
                  type: 'messageType',
                  value: 'protocol'
                }
              }
            }
          }
        },
        addProtocol: {
          tuple: ['int8', 'int8']
        },
        squareProtocol: {
          tuple: ['int8']
        }
      }

      const message1 = {
        type: 'function',
        func: 'add',
        args: {
          protocol: 'addProtocol',
          value: [3, 4]
        },
      }

      const message2 = {
        type: 'function',
        func: 'square',
        args: {
          protocol: 'squareProtocol',
          value: [2]
        }
      }

      const message3 = {
        type: 'return',
        value: {
          protocol: 'int8',
          value: 7
        }
      }

      const result1 = {
        type: 'function',
        func: 'add',
        args: [3, 4]
      }

      const result2 = {
        type: 'function',
        func: 'square',
        args: [2]
      }

      const result3 = {
        type: 'return',
        value: 7
      }

      const {read, write} = protocolCodec(protocol)
      const buf1 = write('myDynamicProtocol', message1)
      const buf2 = write('myDynamicProtocol', message2)
      const buf3 = write('myDynamicProtocol', message3)
      const myDynamicProtocol1 = read('myDynamicProtocol', buf1)
      const myDynamicProtocol2 = read('myDynamicProtocol', buf2)
      const myDynamicProtocol3 = read('myDynamicProtocol', buf3)
      expect(myDynamicProtocol1).toEqual(result1)
      expect(myDynamicProtocol2).toEqual(result2)
      expect(myDynamicProtocol3).toEqual(result3)
    })
  })
})
