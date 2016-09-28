'use strict'

define(['lodash', './proto-buf'], (_, protocolCodec) => {

  describe('Protocol Buffers', function () {
    it('struct', function () {
      const protocol = {
        myStruct: {
          myStruct: {
            struct: {
              s: 'string',
              i: 'uint32'
            }
          }
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write({s: 'hello', i: 54})
      const myStruct = read(buf)
      expect(myStruct).toEqual({s: 'hello', i: 54})
    })

    it('array', function () {
      const protocol = {
        myArray: {
          myArray: {
            array: 'string'
          }
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write(['hello', 'hi'])
      const myArray = read(buf)
      expect(myArray).toEqual(['hello', 'hi'])
    })

    it('tuple', function () {
      const protocol = {
        myTuple: {
          myTuple: {
            tuple: ['string', 'uint32']
          }
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write(['hello', 54])
      const myTuple = read(buf)
      expect(myTuple).toEqual(['hello', 54])
    })

    it('variable length tuple', function () {
      const protocol = {
        myVarargs: {
          myVarargs: {
            varargs: ['string', 'uint32']
          }
        }
      }
      const {read, write} = protocolCodec(protocol)
      const buf = write(['hello', 10, 20, 30])
      const myVarargs = read(buf)
      expect(myVarargs).toEqual(['hello', 10, 20, 30])
    })

    it('union', function () {
      const protocol = {
        myUnion: {
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
      }

      const {read, write} = protocolCodec(protocol)
      const buf1 = write({t: 'a', s: 'hello'})
      const buf2 = write({t: 'b', n: -42})
      const myUnion1 = read(buf1)
      const myUnion2 = read(buf2)
      expect(myUnion1).toEqual({t: 'a', s: 'hello'})
      expect(myUnion2).toEqual({t: 'b', n: -42})
    })
  })
})
