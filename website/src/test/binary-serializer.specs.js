'use strict'

define([
  'lodash',
  'serialization/serialize',
  'serialization/binary-serializer',
  'test/message-rpc.specs.image-serializer',
  'rpc/messages'
], (
  _,
  {Serializable},
  BinarySerializer,
  ImageSerializer,
  Messages
) => {
  describe('Binary Serializer', () =>  {

    it('should serialize a custom type', () => {
      const serializer = BinarySerializer({Image: ImageSerializer})

      const image = new Array(10)

      for(let i = 0; i < image.length; i++){
        image[i] = {red: 255, green: 255, blue: 255}
      }
      image[Serializable] = 'Image'

      const message = Messages.batch([
        Messages.rpcFunctionCall(1, 1, [
          Messages.rpcValue(image)
        ], -2)
      ])

      const buffers = serializer.serialize(message)
      const message2 = serializer.deserialize(buffers)
      console.log(message, message2)
      expect(message).toEqual(message2)
    })
  })
})