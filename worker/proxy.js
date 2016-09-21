'use strict'

const MessageType = {
  Handshake: 0,
  FunctionCall: 1,
  FunctionResult: 2
}

const Handshake = (api) => ({type: MessageType.Handshake, functions: Object.keys(api)})
const FunctionCall = (invocationId, func, args) => ({type: MessageType.FunctionCall, invocationId, func, args})
const FunctionResult = (invocationId, result) => ({type: MessageType.FunctionResult, invocationId, result})

const createPromiseWithExecutor = () => {
  let resolve = undefined
  let reject = undefined

  const promise = new Promise((executorResolve, executorReject) => {
    resolve = executorResolve
    reject = executorReject
  })

  return {promise, resolve, reject}
}

function WorkerProxy(localApi, worker) {
  const localPromiseApi = promiseApi(localApi)
  let invocationId = 0
  const resolvers = []

  let handshakeResolver

  function handshake(functions) {
    const remoteApi = functions.reduce((api, func) => Object.assign(api, {[func]: (...args) => {
      invocationId++
      const {promise, resolve} = createPromiseWithExecutor()
      resolvers.push({invocationId, resolve})
      worker.postMessage(FunctionCall(invocationId, func, args))
      console.log('posting', invocationId, resolvers.length)
      return promise
    }}), {})

    handshakeResolver(remoteApi)
  }

  function functionCall(invocationId, func, args) {
    console.log(`${invocationId}: call: ${func} (${JSON.stringify(args)}) `)
    localPromiseApi[func].apply(null, args).then(result =>
      worker.postMessage(FunctionResult(invocationId, result)))
  }

  function functionResult(invocationId, result) {
    console.log(`${invocationId}: result: ${result}`)
    const index = resolvers.findIndex(e => e.invocationId === invocationId)
    resolvers.splice(index, 1)[0].resolve(result)
  }

  function handleMessage({data: message}) {
    switch(message.type) {
      case MessageType.Handshake:
        handshake(message.functions)
        break;

      case MessageType.FunctionCall:
        functionCall(message.invocationId, message.func, message.args)
        break;

      case MessageType.FunctionResult:
        functionResult(message.invocationId, message.result)
        break;

      default:
        throw `Error: can't handle message!`
    }
  }

  worker.addEventListener('message', handleMessage)
  worker.postMessage(Handshake(localPromiseApi))

  return new Promise(resolve => {
    handshakeResolver = resolve
  })
}
