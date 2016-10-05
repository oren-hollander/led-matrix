'use strict'

define([
  'lodash'
], (
  _
) => {

  function SharedObjectProxy(sharedObject) {
    return new Proxy(sharedObject, {
      get: (target, property) => {
        if(target[property] && target[property].get && _.isFunction(target[property].get))
          return target[property].get()
        else
          return target[property]
      },
      set: (target, property, value) => {
        if(target[property] && target[property].set && _.isFunction(target[property].set)) {
          target[property].set(value)
          return true
        }
        return false
      }
    })
  }

  return SharedObjectProxy
})

