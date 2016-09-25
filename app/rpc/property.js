'use strict'

define(['lodash', 'promise-util'], (_, {promisifyFunction}) => {

  function createProperty(api, propertyNme, propertyValue, onUpdate) {
    // _.forOwn(api, (value, key) => {
    //   if(_.isFunction(value)){
    //     api[key] = promisifyFunction(value)
    //   }
    //   else {
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
      // }
    // })
  }

  return createProperty
})


