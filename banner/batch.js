'use strict'

function promiseApi(api) {
  const papi = {}

  Object.keys(api).forEach(func => {
    papi[func] = (...args) => Promise.resolve(api[func].apply(null, args))
  })

  return papi
}

function batchApi(api) {

  function batch(calls) {
    console.log('batch', calls)
    return calls.map(({func, args}) => api[func].apply(null, args))
  }

  return Object.assign({}, api, {_batch: batch})
}

function batch(api, f) {

  let queue = []

  const batchApi = {}

  Object.keys(api).forEach(func => {
    batchApi[func] = (...args) => {
      const {promise, resolve} = createPromiseWithExecutor()
      if(queue.length === 0){
        setTimeout(performBatch, 0)
      }

      queue.push({func, args, resolve})
      return promise
    }
  })

  f(batchApi)

  function performBatch() {
    console.log('batch', queue.length)
    let q = queue
    queue = []
    api._batch(q.map(call => ({func: call.func, args: call.args}))).then(rs => {
      console.log(q.length)
      rs.forEach((r, i) => {q[i].resolve(r)})
    })
  }
}