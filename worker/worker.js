'use strict'

importScripts('proxy.js')

let appApi

function calculate(a, b, c) {
  appApi.add(a, b).then(r => appApi.mul(r, c)).then(r => console.log(`(${a} + ${b}) * ${c} = ${r}`))
}

function multiply(a, b) {
  console.log(`multiply called`)
  let result = 0
  let count = b

  const {promise, resolve} = createPromiseWithExecutor()

  function addOnce() {
    console.log('add once called')
    appApi.add(result, a).then(r => {
      result = r
      count--
      if(count > 0) {
        addOnce()
      }
      else {
        resolve(result)
      }
    })
  }
  addOnce()

  return promise
}

WorkerProxy({calculate, multiply}, self).then(api => {
   appApi = api
})
