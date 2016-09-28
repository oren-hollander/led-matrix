'use strict'

define(['lodash', './proto-buf'], (_, protocolCodec) => {

  describe('Protocol Buffers', function () {
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
  })
})
