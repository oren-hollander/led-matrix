'use strict'

define(['lodash'], (_) => {
  const createPromise = () => {

    const settleFunctions = {}

    const promise = new Promise((resolve, reject) => {
      settleFunctions.resolve = resolve
      settleFunctions.reject = reject
    })

    return Object.assign(promise, settleFunctions)
  }

  const createPromiseWithSettler = () => {
    let resolve = undefined
    let reject = undefined

    const promise = new Promise((executorResolve, executorReject) => {
      resolve = executorResolve
      reject = executorReject
    })

    return {promise, resolve, reject}
  }

  function promisifyFunction(f) {
    return (...args) => {
      try {
        return Promise.resolve(f(...args))
      }
      catch (e) {
        return Promise.reject(e)
      }
    }
  }

  function promisifyApi(api) {
    return _.mapValues(api, value => {
      if(_.isFunction(value)) {
        return promisifyFunction(value)
      }
      else {
        return value
      }
    })
  }

  return {createPromiseWithSettler, createPromise, promisifyFunction, promisifyApi}
})