'use strict'

define([], () => {

  function createProperty(propertyValue, onUpdate) {
    return {
      get: () => propertyValue,
      set: (newValue, triggerUpdate = true) => {
        propertyValue = newValue
        if(triggerUpdate)
          onUpdate(propertyValue)
      }
    }
  }

  return createProperty
})


