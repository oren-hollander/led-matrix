'use strict'

define(['lodash', 'serializer', 'serializer-registry', 'annotations'], (_,
  {CustomMessageSerializer, InitMessageSerializer, JsonSerializer}, SerializerRegistry,
  {Annotations, annotate, getAnnotation, getAnnotations}) => {

  describe('Custom Serializer', function () {
    it('should serialize as JSON without serializer annotation', function () {
      const message = {
        type: 'init',
        api: ['add', 'div']
      }

      const registry = SerializerRegistry({JSON: JsonSerializer})
      const serializer = CustomMessageSerializer(registry)

      const serializedMessage = serializer.serialize(message)
      const resultMessage = serializer.deserialize(serializedMessage)
      expect(message).toEqual(resultMessage)
    })

    it('should serialize as using a custom serializer by serialization annotation', function () {
      const message = {
        type: 'init',
        api: ['add', 'div']
      }

      const registry = SerializerRegistry({
        InitMessage: InitMessageSerializer
      })

      annotate(message, Annotations.Serialized, 'InitMessage')
      const serializer = CustomMessageSerializer(registry)
      const serializedMessage = serializer.serialize(message)
      const resultMessage = serializer.deserialize(serializedMessage)
      expect(message).toEqual(resultMessage)
    })
  })
})