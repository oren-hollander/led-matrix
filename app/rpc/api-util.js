'use strict'

define(['lodash'], (_) => {

  const ApiSymbol = Symbol('api')
  const ApiProtocol = Symbol('protocol')
  const ApiFunction = Symbol('function')
  const ApiProperty = Symbol('property')

  function defineApi(api, properties = {}, protocol) {
    api[ApiSymbol] = true

    Object.keys(api).forEach(key => {
      if (typeof api[key] === 'function')
        api[key][ApiFunction] = true
    })

    if(protocol)
      api[ApiProtocol] = protocol

    // const createPropertySetter = propertyName => {
    //
    //   const setter = value => {
    //     api[propertyName] = value
    //
    //   }
    //
    //   setter[ApiProperty] = propertyName
    //
    //   return setter
    // }

    const propertiesBySetters = _(properties)
      .toPairs()
      .map(([a, b]) => [b, a])
      .fromPairs()
      .mapValues((propertyName, propertySetterName) => ({[ApiProperty]: propertyName}))
      .value()

    return Object.assign(api, propertiesBySetters)
      // _.mapKeys(properties, (propertySetterName, propertyName) => ({[ApiProperty]: propertySetterName})))

    // properties.mapValues
    // return Object.keys(properties).reduce((api, propertyName) => {
    //   const propertySetterName = properties[propertyName]
    //   return Object.assign(api, {[propertySetterName]: createPropertySetter(propertyName)})
    // }, api)
  }

  return {defineApi, apiSymbols: {ApiSymbol, ApiProtocol, ApiFunction, ApiProperty}}
})