'use strict'

define([
  'lodash',
  'rpc/queue',
  'rpc/messages',
  'rpc/priority',
  'rpc/api-proxy',
  'util/promise',
  'rpc/ref-map',
  'rpc/api-util'
], (
  _,
  Queue,
  Messages,
  {MessagePriorities, CallPriority},
  {ApiProxy, SharedObjectProxy, FunctionProxy},
  {createPromiseWithSettler},
  RefMap,
  {ApiSymbol, FunctionSymbol, SharedObjectSymbol, PropertySymbol}
) => {

  function MessageRPC(localApi, messenger, serializer, monitor) {
    let initialized = false
    let queue = Queue(sendBatch)
    const settlers = new Map()
    const stubs = RefMap()
    const proxies = RefMap()

    const localApiStub = stubs.add(localApi)
    const {promise: proxyPromise, resolve: resolveProxy} = createPromiseWithSettler() // todo: handle reject with timeout
    sendMessage(Messages.init(Object.keys(localApi)))

    const createSharedObject = (prototype, updateProperty) => {
      const ref = stubs.reserveRefId()
      const sharedObject = _(prototype)
        .mapValues((value, name) => ({
          [PropertySymbol]: name,
          set: (newValue, triggerUpdate = true) => {
            value = newValue
            if(triggerUpdate && sharedObject[SharedObjectSymbol].connected)
              updateProperty(ref, name, value, sharedObject[CallPriority])
          },
          get: () => value,
        }))
        .value()

      sharedObject[SharedObjectSymbol] = {
        ref,
        connected: false
      }
      sharedObject[CallPriority] = MessagePriorities.Immediate

      stubs.add(sharedObject, ref)
      return sharedObject
    }

    function onInit(remoteApi) {
      if(!initialized){
        initialized = true
        sendMessage(Messages.init(Object.keys(localApi)))
        const proxy = ApiProxy(remoteApi, localApiStub, handleOutgoingApiCall)
        resolveProxy({api: proxy, createSharedObject: prototype => createSharedObject(prototype, handleOutgoingProxyPropertyUpdate)})
      }
    }

    function sendBatch(rpcMessages) {
      if(monitor)
        monitor.drainMessageQueue(rpcMessages)

      sendMessage(Messages.batch(rpcMessages))
    }

    // todo: consider how to treat the same proxy added multiple times
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
        const properties = _.mapValues(value, v => v.get())
        value[SharedObjectSymbol].connected = true
        return Messages.rpcSharedObject(value[SharedObjectSymbol].ref, properties)
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
          const proxy = SharedObjectProxy(value.properties, value.ref, handleOutgoingStubPropertyUpdate)
          proxies.add(proxy, value.ref)
          return proxy
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
      stubs.get(ref)(... args.map(processIncomingRpcValue))
        .then(result => {
          handleOutgoingReturn(result, id, ref, returnPriority, ts)
        })
        .catch(error => {
          handleOutgoingError(error, id, ref, returnPriority, ts)
        })
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
      stubs.get(ref)[prop].set(value, false)
    }

    function handleIncomingStubPropertyUpdate({ref, prop, value}){
      proxies.get(ref)[prop].set(value, false)
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
      if(monitor)
        monitor.outgoingMessage(message)

      messenger.send(serializer.serialize(message))
    }

    const onmessage = data => {
      const message = serializer.deserialize(data)
      if(monitor)
        monitor.incomingMessage(message)

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
    messenger.setReceiver(onmessage)

    return proxyPromise
  }

  return MessageRPC
})

/*
 todo
 ==============
 . support ArrayBuffer passing by ref
 . consider adapting to web sockets
 . proto-buf for proxy functions & properties instead of json
 . revoke / garbage collection for stubs
 . stress test and compare [proto | native | json] serializers
 */
