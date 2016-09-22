'use strict'

define(['queue', 'messages', 'priority', 'api-proxy', 'promise-util', 'stub', 'api-util', 'serializer'],
  (Queue, Messages, {MessagePriorities}, ApiProxy, {createPromiseWithSettler, promisifyApi}, Stubs, {ApiSymbol},
  Serializer) => {

  function MessageRPC(localApi, worker) {
    let initialized = false
    let queue = Queue(sendBatch)
    const settlers = new Map()
    const localApiStub = Stubs.add(promisifyApi(localApi))

    sendMessage(Messages.init(Object.keys(localApi)))

    function onInit(remoteApi) {
      if(!initialized){
        initialized = true
        sendMessage(Messages.init(Object.keys(localApi)))
        const proxy = ApiProxy(remoteApi, localApiStub, handleOutgoingCall)
        resolveProxy(proxy)
      }
    }

    function sendBatch(rpcMessages) {
      sendMessage(Messages.batch(rpcMessages))
    }

    // todo: shouldn't add twice the same api
    function processOutgoingRpcValue(value) {
      if(value && value[ApiSymbol]){
        const stub = Stubs.add(promisifyApi(value))
        return Messages.rpcApiValue(Object.keys(value), stub)
      }
      else {
        return Messages.rpcDataValue(value)
      }
    }

    function handleOutgoingCall(id, stub, func, args, callPriority, returnPriority, settler) {
      console.log('outgoing call', id, func, args, callPriority, returnPriority)
      if(returnPriority === MessagePriorities.None)
        settler.resolve()
      else
        settlers.set(id, settler)

      const rpcMessage = Messages.rpcCall(id, stub, func, args.map(processOutgoingRpcValue), returnPriority)

      if(callPriority === MessagePriorities.Immediate){
        sendMessage(Messages.batch([rpcMessage]))
      }
      else {
        queue.add(rpcMessage, callPriority)
      }
    }

    function handleOutgoingReturn(result, id, stub, returnPriority) {

      let rpcMessage = Messages.rpcReturn(id, stub, processOutgoingRpcValue(result))

      if(returnPriority === MessagePriorities.Immediate){
        sendMessage(Messages.batch([rpcMessage]))
      }
      else {
        queue.add(rpcMessage, returnPriority)
      }
    }

    function handleOutgoingError(error, id, stub, returnPriority) {
      const rpcMessage = Messages.rpcError(id, stub, error)

      if(returnPriority === MessagePriorities.Immediate){
        sendMessage(Messages.batch([rpcMessage]))
      }
      else {
        queue.add(rpcMessage, returnPriority)
      }
    }

    function processIncomingRpcValue(value) {
      switch(value.type) {
        case Messages.Types.DataValue:
          return value.data
        case Messages.Types.ApiValue:
          return ApiProxy(value.api, value.stub, handleOutgoingCall)
          break
        default:
          throw `Unknown type: ${value.type}`
      }
    }

    function handleIncomingCall(callMessage) {
      console.log('incoming call', callMessage.id, callMessage.stub, callMessage.func, callMessage.args, callMessage.returnPriority)
      Stubs.get(callMessage.stub)[callMessage.func](... callMessage.args.map(processIncomingRpcValue))
        .then(result => {
          handleOutgoingReturn(result, callMessage.id, callMessage.stub, callMessage.returnPriority)
        })
        .catch(error => {
          handleOutgoingError(error, callMessage.id, callMessage.stub, callMessage.returnPriority)
        })
    }

    function handleIncomingReturn(returnMessage) {
      const settler = settlers.get(returnMessage.id)
      settlers.delete(returnMessage.id)
      settler.resolve(processIncomingRpcValue(returnMessage.value))
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
      const {message: messageData, transferList} = Serializer.serialize(message)
      worker.postMessage(messageData, transferList)
    }

    worker.onmessage = ({data}) => {
      console.log('message ', data)
      const message = Serializer.deserialize(data)
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

    const {promise: proxyPromise, resolve: resolveProxy} = createPromiseWithSettler()
    return proxyPromise
  }

  return MessageRPC
})
