'use strict'

define(['lodash'], (_) => {
  const Annotations = {
    Serialized: Symbol('serialized'),
    CallPriority: Symbol('call-priority'),
    ReturnPriority: Symbol('return-priority'),
    Api: Symbol('api'),
    Property: Symbol('property'),
    SharedObject: Symbol('shared-object'),
    Function: Symbol('function'),
    Protocol: Symbol('protocol')
  }

  function annotate(object, annotation, value) {
    if(_.some(Annotations, _.partial(_.eq, annotation))) {
      object[annotation] = value
    }
    else {
      throw new Error(`Unknown annotation`)
    }
  }

  function getAnnotation(object, annotation) {

    if(_.some(Annotations, _.partial(_.eq, annotation))){
      return object[annotation]
    }
    else {
      throw new Error(`Unknown annotation`)
    }
  }

  function getAnnotations(object) {
    return _.intersection(Object.getOwnPropertySymbols(object), _.values(Annotations))
  }

  return {Annotations, annotate, getAnnotation, getAnnotations}
})