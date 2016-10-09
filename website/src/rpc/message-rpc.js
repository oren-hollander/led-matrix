'use strict'

define([
  'lodash',
  'rpc/queue',
  'rpc/messages',
  'rpc/priority',
  'rpc/api-proxy',
  'util/promise',
  'rpc/ref-map',
  'rpc/api-util',
  'rpc/remote'
], (
  _,
  Queue,
  Messages,
  {MessagePriorities},
  {ApiProxy, SharedObjectProxy, FunctionProxy},
  {createPromiseWithSettler},
  RefMap,
  {ApiSymbol, FunctionSymbol, SharedObjectSymbol, RefId},
  {RemoteFunction}
) => {

  function MessageRPC(messenger, monitor) {
    let queue = Queue(sendBatch)
    const settlers = new Map()
    const stubs = RefMap()
    const proxies = RefMap()

    const {promise: connectPromise, resolve: connectResolve} = createPromiseWithSettler()
    const remoteConnect = RemoteFunction(obj => {
      connectResolve(obj)
    })

    const rootRef = stubs.add(remoteConnect)

    const {promise: proxyPromise, resolve: resolveInit} = createPromiseWithSettler() // todo: handle reject with timeout
    sendMessage(Messages.init(rootRef, false))

    const createSharedObject = (properties) => {
      const ref = stubs.reserveRefId()
      const proxyWithSetters = SharedObjectProxy(properties, ref, handleOutgoingProxyPropertyUpdate)
      stubs.add(proxyWithSetters, ref)
      return proxyWithSetters.proxy
    }

    const releaseRef = (refs, messageFactory) => obj => {
      const ref = obj[RefId]
      if(ref && refs.has(ref)){
        refs.release(ref)
        sendMessageByPriority(messageFactory(ref), MessagePriorities.Low)
      }
    }

    function onInit(remoteRootRef, ack) {
      if(!ack)
        sendMessage(Messages.init(rootRef, true))

      resolveInit({
        connect: obj => {
          if(obj)
            FunctionProxy(remoteRootRef, handleOutgoingFunctionCall)(obj)
          return connectPromise
        },
        createSharedObject: createSharedObject,
        releaseProxy: releaseRef(proxies, Messages.releaseStub),
        releaseStub: releaseRef(stubs, Messages.releaseProxy)
      })
    }

    function sendBatch(rpcMessages) {
      if(monitor)
        monitor.drainMessageQueue(rpcMessages)

      sendMessage(Messages.batch(rpcMessages))
    }

    function processOutgoingRpcValue(value) {
      if(value && value[ApiSymbol]){
        const ref = stubs.add(value)
        return Messages.rpcApi(ref, _.keys(value))
      }
      else if(value && value[FunctionSymbol]) {
        const ref = stubs.add(value)
        return Messages.rpcFunction(ref)
      }
      else if(value && value[SharedObjectSymbol]) {
        const properties = _.mapValues(value, _.identity)
        value[SharedObjectSymbol].connected = true
        return Messages.rpcSharedObject(value[RefId], properties)
      }
      else {
        return Messages.rpcValue(value)
      }
    }

    function processIncomingRpcValue(value) {
      switch(value.type) {
        case Messages.Types.Value:
          return value.value
        case Messages.Types.Function:
          return FunctionProxy(value.ref, handleOutgoingFunctionCall)
        case Messages.Types.Api:
          return ApiProxy(value.functionNames, value.ref, handleOutgoingApiCall)
        case Messages.Types.SharedObject:
          const proxyWithSetters = SharedObjectProxy(value.properties, value.ref, handleOutgoingStubPropertyUpdate)
          proxyWithSetters.proxy[SharedObjectSymbol].connected = true

          proxies.add(proxyWithSetters, value.ref)
          return proxyWithSetters.proxy
        default:
          throw `Unknown type: ${value.type}`
      }
    }

    function sendMessageByPriority(message, priority){
      if(priority === MessagePriorities.Immediate){
        sendMessage(Messages.batch([message]))
      }
      else {
        if(monitor)
          monitor.queueMessage(message)
        queue.schedule(message, priority)
      }
    }

    function handleOutgoingApiCall(id, ref, func, args, callPriority, returnPriority, settler) {
      if(returnPriority === MessagePriorities.None)
        settler.resolve()
      else
        settlers.set(id, settler)

      const rpcMessage = Messages.rpcApiCall(id, ref, func, _.map(args, processOutgoingRpcValue), returnPriority)

      sendMessageByPriority(rpcMessage, callPriority)
    }

    function handleOutgoingFunctionCall(id, ref, args, callPriority, returnPriority, settler) {
      if(returnPriority === MessagePriorities.None)
        settler.resolve()
      else
        settlers.set(id, settler)

      const rpcMessage = Messages.rpcFunctionCall(id, ref, args.map(processOutgoingRpcValue), returnPriority)

      sendMessageByPriority(rpcMessage, callPriority)
    }

    function handleOutgoingProxyPropertyUpdate(ref, prop, value, priority) {
      sendMessageByPriority(Messages.rpcProxyPropertyUpdate(ref, prop, value), priority)
    }

    function handleOutgoingStubPropertyUpdate(ref, prop, value, priority) {
      sendMessageByPriority(Messages.rpcStubPropertyUpdate(ref, prop, value), priority)
    }

    function handleOutgoingReturn(result, id, ref, returnPriority, callTimestamp) {
      let rpcMessage = Messages.rpcReturn(id, ref, processOutgoingRpcValue(result), callTimestamp)
      sendMessageByPriority(rpcMessage, returnPriority)
    }

    function handleOutgoingError(error, id, ref, returnPriority, callTimestamp) {
      const rpcMessage = Messages.rpcError(id, ref, error.toString(), callTimestamp)
      sendMessageByPriority(rpcMessage, returnPriority)
    }

    function handleIncomingApiCall({id, ref, func, args, returnPriority, ts}) {
      const promise = stubs.get(ref)[func](... args.map(processIncomingRpcValue))
      if(returnPriority !== MessagePriorities.None) {
        promise.then(result => {
          handleOutgoingReturn(result, id, ref, returnPriority, ts)
        })
        .catch(error => {
          handleOutgoingError(error, id, ref, returnPriority, ts)
        })
      }
    }

    function handleIncomingFunctionCall({id, ref, args, returnPriority, ts}) {
      const promise = stubs.get(ref)(... args.map(processIncomingRpcValue))
      if(returnPriority !== MessagePriorities.None) {
        promise.then(result => {
          handleOutgoingReturn(result, id, ref, returnPriority, ts)
        })
        .catch(error => {
          handleOutgoingError(error, id, ref, returnPriority, ts)
        })
      }
    }

    function handleIncomingReturn({id, value}) {
      const settler = settlers.get(id)
      settlers.delete(id)
      settler.resolve(processIncomingRpcValue(value))
    }

    function handleIncomingError({id, error}) {
      const settler = settlers.get(id)
      settlers.delete(id)
      settler.reject(error)
    }

    function handleIncomingProxyPropertyUpdate({ref, prop, value}){
      stubs.get(ref).setters[prop](value)
    }

    function handleIncomingStubPropertyUpdate({ref, prop, value}){
      proxies.get(ref).setters[prop](value)
    }

    function onBatch(rpcMessage) {
      const apiCalls = rpcMessage.filter(Messages.isApiCall)
      const functionCalls = rpcMessage.filter(Messages.isFunctionCall)
      const returns = rpcMessage.filter(Messages.isReturn)
      const errors = rpcMessage.filter(Messages.isError)
      const proxyPropertyUpdates = rpcMessage.filter(Messages.isProxyPropertyUpdate)
      const stubPropertyUpdates = rpcMessage.filter(Messages.isStubPropertyUpdate)

      errors.forEach(handleIncomingError)
      returns.forEach(handleIncomingReturn)
      apiCalls.forEach(handleIncomingApiCall)
      functionCalls.forEach(handleIncomingFunctionCall)
      proxyPropertyUpdates.forEach(handleIncomingStubPropertyUpdate)
      stubPropertyUpdates.forEach(handleIncomingProxyPropertyUpdate)
    }

    function sendMessage(message) {
      if(monitor) {
        monitor.outgoingMessage(message)
        // monitor.serializeStart()
      }

      // const serializedMessage = serializer.serialize(message)

      // if(monitor)
      //   monitor.serializeEnd()

      messenger.send(message)
    }

    const onmessage = message => {
      // if(monitor)
      //   monitor.deserializeStart()

      // const message = serializer.deserialize(data)

      if(monitor){
        // monitor.deserializeEnd()
        monitor.incomingMessage(message)
      }

      switch (message.type) {
        case Messages.Types.Init:
          onInit(message.rootRef, message.ack)
          break
        case Messages.Types.Batch:
          onBatch(message.rpcMessages)
          break
        case Messages.Types.ReleaseProxy:
          proxies.release(message.ref)
          break
        case Messages.Types.ReleaseStub:
          stubs.release(message.ref)
          break
        default:
          throw 'Unknown message!'
      }
    }
    messenger.setReceiver(onmessage)

    return proxyPromise
  }

  return MessageRPC
})

/*
 todo
 ==============
 . support ArrayBuffer passing by ref
 . binary serialization with debug info
 . release refs / garbage collection for stubs
 . stress test and compare [proto | native | json] serializers
 */
