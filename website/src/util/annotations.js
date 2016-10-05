'use strict'

define(['lodash'], (_) => {
  const Annotations = {}

  function registerAnnotation(name, symbol) {
    if(Annotations[name])
      throw new Error(`Annotation ${name} already registered`)

    Annotations[name] = symbol
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

  return {Annotations, registerAnnotation, annotate, getAnnotation, getAnnotations}
})