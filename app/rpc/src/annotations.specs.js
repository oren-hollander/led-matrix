'use strict'

define(['lodash', 'annotations'], (_, {Annotations, annotate, getAnnotation, getAnnotations}) => {
  describe('Annotations', function () {
    it('should not be able to annotate with an unknown annotation', function () {
      expect(() => {
        const myObject = {}
        annotate(myObject, Symbol('my invented annotation'), 'Some value')
      }).toThrowError('Unknown annotation')
    })

    it('should not be able to get annotation with an unknown annotation', function () {
      expect(() => {
        const myObject = {}
        getAnnotation(myObject, Symbol('my invented annotation'))
      }).toThrowError('Unknown annotation')
    })

    it('should annotate with a known annotation', function () {
      const myObject = {}
      annotate(myObject, Annotations.Serialized, 'Some value')
      const annotationValue = getAnnotation(myObject, Annotations.Serialized)
      expect(annotationValue).toEqual('Some value')
    })

    it('should return all annotation', function () {
      const myObject = {}
      annotate(myObject, Annotations.Serialized, 'Some value')
      annotate(myObject, Annotations.Protocol, 'Some other value')
      const annotations = getAnnotations(myObject)
      expect(annotations).toContain(Annotations.Serialized)
      expect(annotations).toContain(Annotations.Protocol)
      expect(annotations.length).toBe(2)
    })
  })
})
