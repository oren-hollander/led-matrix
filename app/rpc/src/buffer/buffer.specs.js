'use strict'

define(['lodash', './buffer'], (_, {SerialBufferWriter, SerialBufferReader}) => {

  describe('Buffers', function () {
    it('should connect and update properties', function () {
      const writer = SerialBufferWriter()
      writer.uint8(200)
      const reader = SerialBufferReader(writer.buffers)
      expect(reader.uint8()).toBe(200)
    })
  })

})
