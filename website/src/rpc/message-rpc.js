'use strict'

define([
  'lodash',
  'rpc/queue',
  'rpc/messages',
  'rpc/priority',
  'rpc/api-proxy',
  'util/promise',
  'rpc/stub',
  'rpc/api-util',
  'rpc/serializer'
], (
  _,
  Queue,
  Messages,
  {MessagePriorities, CallPriority},
  {ApiProxy, SharedObjectProxy, FunctionProxy},
  {createPromiseWithSettler},
  Stubs,
  {ApiSymbol, FunctionSymbol, SharedObjectSymbol, PropertySymbol},
  {JsonMessageSerializer}
) => {

  function MessageRPC(localApi, messenger, monitor) {
    let initialized = false
    let queue = Queue(sendBatch)
    const settlers = new Map()
    const stubs = Stubs()
    const proxies = Stubs()
    const serializer = JsonMessageSerializer

    const localApiStub = stubs.add(localApi)
    const {promise: proxyPromise, resolve: resolveProxy} = createPromiseWithSettler() // todo: handle reject with timeout
    sendMessage(Messages.init(Object.keys(localApi)))

    const createSharedObject = (prototype, updateProperty) => {
      const stub = stubs.createId()
      const sharedObject = _(prototype)
        .mapValues((value, name) => ({
          [PropertySymbol]: name,
          set: (newValue, triggerUpdate = true) => {
            value = newValue
            if(triggerUpdate && sharedObject[SharedObjectSymbol].connected)
              updateProperty(stub, name, value, sharedObject[CallPriority])
          },
          get: () => value,
        }))
        .value()

      sharedObject[SharedObjectSymbol] = {
        stub,
        connected: false
      }
      sharedObject[CallPriority] = MessagePriorities.High

        stubs.add(sharedObject, stub)
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
        const stub = stubs.add(value)
        return Messages.rpcApi(stub, _.keys(value))
      }
      else if(value && value[FunctionSymbol]) {
        const stub = stubs.add(value)
        return Messages.rpcFunction(stub)
      }
      else if(value && value[SharedObjectSymbol]) {
        const properties = _.mapValues(value, v => v.get())
        value[SharedObjectSymbol].connected = true
        return Messages.rpcSharedObject(value[SharedObjectSymbol].stub, properties)
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
          return FunctionProxy(value.stub, handleOutgoingFunctionCall)
        case Messages.Types.Api:
          return ApiProxy(value.functionNames, value.stub, handleOutgoingApiCall)
        case Messages.Types.SharedObject:
          const proxy = SharedObjectProxy(value.properties, value.stub, handleOutgoingStubPropertyUpdate)
          proxies.add(proxy, value.stub)
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
        queue.add(message, priority)
      }
    }

    function handleOutgoingApiCall(id, stub, func, args, callPriority, returnPriority, settler) {
      if(returnPriority === MessagePriorities.None)
        settler.resolve()
      else
        settlers.set(id, settler)

      const rpcMessage = Messages.rpcApiCall(id, stub, func, _.map(args, processOutgoingRpcValue), returnPriority)

      sendMessageByPriority(rpcMessage, callPriority)
    }

    function handleOutgoingFunctionCall(id, stub, args, callPriority, returnPriority, settler) {
      if(returnPriority === MessagePriorities.None)
        settler.resolve()
      else
        settlers.set(id, settler)

      const rpcMessage = Messages.rpcFunctionCall(id, stub, args.map(processOutgoingRpcValue), returnPriority)

      sendMessageByPriority(rpcMessage, callPriority)
    }

    function handleOutgoingProxyPropertyUpdate(stub, prop, value, priority) {
      sendMessageByPriority(Messages.rpcProxyPropertyUpdate(stub, prop, value), priority)
    }

    function handleOutgoingStubPropertyUpdate(stub, prop, value, priority) {
      sendMessageByPriority(Messages.rpcStubPropertyUpdate(stub, prop, value), priority)
    }

    function handleOutgoingReturn(result, id, stub, returnPriority, callTimestamp) {
      let rpcMessage = Messages.rpcReturn(id, stub, processOutgoingRpcValue(result), callTimestamp)
      sendMessageByPriority(rpcMessage, returnPriority)
    }

    function handleOutgoingError(error, id, stub, returnPriority, callTimestamp) {
      const rpcMessage = Messages.rpcError(id, stub, error.toString(), callTimestamp)
      sendMessageByPriority(rpcMessage, returnPriority)
    }

    function handleIncomingApiCall({id, stub, func, args, returnPriority, ts}) {
      const promise = stubs.get(stub)[func](... args.map(processIncomingRpcValue))
      if(returnPriority !== MessagePriorities.None) {
        promise.then(result => {
          handleOutgoingReturn(result, id, stub, returnPriority, ts)
        })
        .catch(error => {
          handleOutgoingError(error, id, stub, returnPriority, ts)
        })
      }
    }

    function handleIncomingFunctionCall({id, stub, args, returnPriority, ts}) {
      stubs.get(stub)(... args.map(processIncomingRpcValue))
        .then(result => {
          handleOutgoingReturn(result, id, stub, returnPriority, ts)
        })
        .catch(error => {
          handleOutgoingError(error, id, stub, returnPriority, ts)
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

    function handleIncomingProxyPropertyUpdate({stub, prop, value}){
      stubs.get(stub)[prop].set(value, false)
    }

    function handleIncomingStubPropertyUpdate({stub, prop, value}){
      proxies.get(stub)[prop].set(value, false)
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

      const {message: messageData} = serializer.serialize(message)
      messenger.send(messageData)
    }

    const onmessage = ({data}) => {
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
