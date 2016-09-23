'use strict'

function loadWorker(url, api) {
  const worker = new Worker(url)

  worker.addEventListener('message',
    ({data: {invocationId, functionName, args}}) => Promise.resolve(api[functionName].apply(null, args)).then(r => worker.postMessage({invocationId, result: r})))
}