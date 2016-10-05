'use strict'

define(['lodash', 'util/annotations'], (_, {Annotations, annotate, getAnnotation, getAnnotations, registerAnnotation}) => {
  describe('Annotations', function () {

    registerAnnotation('MyAnnotation', Symbol('my-annotation'))
    registerAnnotation('MyOtherAnnotation', Symbol('my-other-annotation'))

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
      annotate(myObject, Annotations.MyAnnotation, 'Some value')
      const annotationValue = getAnnotation(myObject, Annotations.MyAnnotation)
      expect(annotationValue).toEqual('Some value')
    })

    it('should return all annotation', function () {
      const myObject = {}
      annotate(myObject, Annotations.MyAnnotation, 'Some value')


      annotate(myObject, Annotations.MyOtherAnnotation, 'Some other value')
      const annotations = getAnnotations(myObject)
      expect(annotations).toContain(Annotations.MyAnnotation)
      expect(annotations).toContain(Annotations.MyOtherAnnotation)
      expect(annotations.length).toBe(2)
    })
  })
})
