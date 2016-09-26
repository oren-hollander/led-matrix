'use strict'

define([], () => {

  function createProperty(api, propertyNme, propertyValue, onUpdate) {
    api[propertyNme] = {
      get: () => propertyValue,
      set: newValue => {
        propertyValue = newValue
        onUpdate(propertyValue)
      },
      _set: newValue => {
        propertyValue = newValue
      }
    }
  }

  return createProperty
})


