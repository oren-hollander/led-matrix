'use strict'

define(['lodash', 'api-util', 'promise-util'], (_, {ApiSymbol}, {promisifyApi}) => {

  function RemoteObject(object) {
    object[ApiSymbol] = true
    return object
  }

  function setterName(propertyName) {
    return 'set' + propertyName.charAt(0).toUpperCase() + propertyName.substring(1)
  }

  function ExposedObject(object){

    const properties = _.pickBy(object, _.negate(_.isFunction))
    const propertyNames = _.keys(properties)
    let updateShadowProperty

    const remotePropertySetters = _(propertyNames)
      .map(name => [setterName(name), value => {
        properties[name] = value
      }])
      .fromPairs()
      .value()

    const functions = _.pickBy(object, _.isFunction)
    const remoteFunctions = _.assign({}, functions, remotePropertySetters, {connect: onUpdate => {
      updateShadowProperty = onUpdate
      return properties
    }})
    const remoteApi = RemoteObject(remoteFunctions)

    const localPropertySetters = _(propertyNames)
      .map(name => [setterName(name), value => {
        properties[name] = value
        updateShadowProperty(name, value)
      }])
      .fromPairs()
      .value()

    const localApi = _.assign(properties, localPropertySetters)

    return {remoteApi: promisifyApi(remoteApi), localApi}
  }

  function ShadowObject(remoteApi){
    const shadow = {}

    const onUpdate = (name, value) => {
      shadow[name] = value
    }

    var connect = remoteApi.connect(onUpdate);
    return connect.then(properties => {
      const propertySetters = _(properties)
        .keys()
        .map(name => [setterName(name), value => {
          shadow[name] = value
          remoteApi[setterName(name)](value)
        }])
        .fromPairs()
        .value()

      _.assign(shadow, properties, propertySetters)

      return shadow
    })
  }

  const setterProxy = object => new Proxy(object, {
    set: (target, property, value) => {
      object[setterName(property)](value)
      return true
    }
  })

  function ExposedObjectProxy(object){
    const {remoteApi, localApi} = ExposedObject(object)
    return {remoteApi, localApi: setterProxy(localApi)}
  }

  function ShadowObjectProxy(remoteApi){
    return ShadowObject(remoteApi).then(setterProxy)
  }

  return {RemoteObject, ShadowObject, ExposedObject, ExposedObjectProxy, ShadowObjectProxy}
})