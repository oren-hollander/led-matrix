'use strict'

define(['queue', 'messages', 'priority', 'api-proxy', 'promise-util'], (Queue, Messages, {MessagePriorities}, ApiProxy, {createPromiseWithSettler, promisifyApi}) => {

  function MessageRPC(localApi, worker) {
    let initialized = false
    let queue = Queue()
    const settlers = new Map()
    localApi = promisifyApi(localApi)

    function sendQueue() {
      sendMessage(batch(queue.drain()))
    }

    function onInit(remoteApi) {
      if(!initialized){
        console.log('initialized')
        initialized = true
        sendMessage(Messages.init(Object.keys(localApi)))
        const proxy = ApiProxy(remoteApi, handleOutgoingCall)
        resolveProxy(proxy)
      }
    }

    function handleOutgoingCall(id, func, args, callPriority, returnPriority, settler) {
      if(callPriority === MessagePriorities.Immediate){
        if(returnPriority === MessagePriorities.None)
          settler.resolve()
        else
          settlers.set(id, settler)

        sendMessage(Messages.batch([Messages.call(id, func, args, returnPriority)]))
      }
      console.log('handling call', id, func, args, callPriority, returnPriority)
    }

    function handleOutgoingReturn(result, id, returnPriority) {
      if(returnPriority === MessagePriorities.Immediate){
        const rpcMessage = Messages.result(id, result)
        sendMessage(Messages.batch([rpcMessage]))
      }
    }

    function handleOutgoingError(error, id, returnPriority) {
      if(returnPriority === MessagePriorities.Immediate){
        const rpcMessage = Messages.error(id, error)
        sendMessage(Messages.batch([rpcMessage]))
      }
    }

    function handleIncomingCall(callMessage) {
      localApi[callMessage.func](... callMessage.args)
        .then(result => {
          handleOutgoingReturn(result, callMessage.id, callMessage.returnPriority)
        })
        .catch(error => {
          handleOutgoingError(error, callMessage.id, callMessage.returnPriority)
        })
    }

    function handleIncomingReturn(returnMessage) {
      const settler = settlers.get(returnMessage.id)
      settlers.delete(returnMessage.id)
      settler.resolve(returnMessage.value)
    }

    function handleIncomingError(errorMessage) {
      const settler = settlers.get(errorMessage.id)
      settlers.delete(errorMessage.id)
      settler.reject(errorMessage.error)
    }

    function onBatch(rpcMessage) {
      const calls = rpcMessage.filter(Messages.isCall)
      const returns = rpcMessage.filter(Messages.isReturn)
      const errors = rpcMessage.filter(Messages.isError)

      errors.forEach(handleIncomingError)
      returns.forEach(handleIncomingReturn)
      calls.forEach(handleIncomingCall)
    }

    function sendMessage(message) {
      worker.postMessage(Messages.serialize(message))
    }

    worker.onmessage = ({data}) => {
      // console.log('message received at', master ? 'master' : 'slave', data)
      const message = Messages.deserialize(data)
      switch (message.type) {
        case Messages.Types.Init:
          onInit(message.api)
          break
        case Messages.Types.Batch:
          onBatch(message.rpcMessages)
          break
        default:
          throw 'Unknown message!'
      }
    }

    sendMessage(Messages.init(Object.keys(localApi)))

    const {promise: proxyPromise, resolve: resolveProxy} = createPromiseWithSettler()
    return proxyPromise
  }

  return MessageRPC
})
