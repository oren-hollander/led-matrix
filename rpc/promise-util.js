'use strict'

define([], () => {
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
    return Object.keys(api).reduce((obj, func) => Object.assign(obj, {[func]: promisifyFunction(api[func])}), {})
  }

  return {createPromiseWithSettler, promisifyFunction, promisifyApi}
})