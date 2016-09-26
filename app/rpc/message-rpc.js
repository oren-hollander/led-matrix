'use strict'

define(['lodash', 'queue', 'messages', 'priority', 'api-proxy', 'promise-util', 'stub', 'api-util', 'serializer',
    'property'],
  (_, Queue, Messages, {MessagePriorities}, ApiProxy, {createPromiseWithSettler, promisifyApi, promisifyFunction},
  Stubs, {ApiSymbol}, Serializer, createProperty) => {

  function MessageRPC(localApi, worker, monitor) {
    let initialized = false
    let queue = Queue(sendBatch)
    const settlers = new Map()
    const stubs = Stubs()
    const proxies = Stubs()

    const localApiStub = stubs.add(promisifyApi(localApi))
    const {promise: proxyPromise, resolve: resolveProxy} = createPromiseWithSettler()
    sendMessage(Messages.init(Object.keys(localApi)))

    const proxyHandlers = {makeCall: handleOutgoingCall, updateProperty: handleOutgoingProxyPropertyUpdate}

    function onInit(remoteApi) {
      if(!initialized){
        initialized = true
        sendMessage(Messages.init(Object.keys(localApi)))
        const proxy = ApiProxy(remoteApi, [], localApiStub, proxyHandlers)
        resolveProxy(proxy)
      }
    }

    function sendBatch(rpcMessages) {
      if(monitor)
        monitor.drainMessageQueue(rpcMessages)

      sendMessage(Messages.batch(rpcMessages))
    }

    function addStub(api, propertyUpdater) {
      const stub = stubs.add(api)

      _.forOwn(api, (value, key) => {
        if(_.isFunction(value)){
          api[key] = promisifyFunction(value)
        }
        else {
          createProperty(api, key, value, newValue => {
            propertyUpdater(stub, key, newValue)
          })
        }
      })

      return stub
    }

    // todo: consider how to treat the same proxy added multiple times
    function processOutgoingRpcValue(value) {
      if(value && value[ApiSymbol]){
        if(_.isFunction(value)){
          const stub = stubs.add({func: promisifyFunction(value)})
          return Messages.rpcFunctionValue(stub)
        }
        else {
          const properties = _.pickBy(value, _.negate(_.isFunction))
          const stub = addStub(value, handleOutgoingStubPropertyUpdate)
          const functionNames = _(value).pickBy(_.isFunction).keys().value()

          return Messages.rpcApiValue(functionNames, properties, stub)
        }
      }
      else {
        return Messages.rpcDataValue(value)
      }
    }

    function processIncomingRpcValue(value) {
      switch(value.type) {
        case Messages.Types.DataValue:
          return value.data
        case Messages.Types.FunctionValue:
          return ApiProxy(['func'], {}, value.stub, proxyHandlers)['func']
        case Messages.Types.ApiValue:
          const proxy = ApiProxy(value.functionNames, value.properties, value.stub, proxyHandlers)
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

    function handleOutgoingCall(id, stub, func, args, callPriority, returnPriority, settler) {
      if(returnPriority === MessagePriorities.None)
        settler.resolve()
      else
        settlers.set(id, settler)

      const rpcMessage = Messages.rpcCall(id, stub, func, args.map(processOutgoingRpcValue), returnPriority)

      sendMessageByPriority(rpcMessage, callPriority)
    }

    function handleOutgoingProxyPropertyUpdate(stub, prop, value) {
      sendMessageByPriority(Messages.rpcProxyPropertyUpdate(stub, prop, value), MessagePriorities.Immediate)
    }

    function handleOutgoingStubPropertyUpdate(stub, prop, value) {
      sendMessageByPriority(Messages.rpcStubPropertyUpdate(stub, prop, value), MessagePriorities.Immediate)
    }

    function handleOutgoingReturn(result, id, stub, returnPriority, callTimestamp) {
      let rpcMessage = Messages.rpcReturn(id, stub, processOutgoingRpcValue(result), callTimestamp)
      sendMessageByPriority(rpcMessage, returnPriority)
    }

    function handleOutgoingError(error, id, stub, returnPriority, callTimestamp) {
      const rpcMessage = Messages.rpcError(id, stub, error, callTimestamp)
      sendMessageByPriority(rpcMessage, returnPriority)
    }

    function handleIncomingCall({id, stub, func, args, returnPriority, ts}) {
      stubs.get(stub)[func](... args.map(processIncomingRpcValue))
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
      stubs.get(stub)[prop]._set(value)
    }

    function handleIncomingStubPropertyUpdate({stub, prop, value}){
      proxies.get(stub)[prop]._set(value)
    }

    function onBatch(rpcMessage) {
      const calls = rpcMessage.filter(Messages.isCall)
      const returns = rpcMessage.filter(Messages.isReturn)
      const errors = rpcMessage.filter(Messages.isError)
      const proxyPropertyUpdates = rpcMessage.filter(Messages.isProxyPropertyUpdate)
      const stubPropertyUpdates = rpcMessage.filter(Messages.isStubPropertyUpdate)

      errors.forEach(handleIncomingError)
      returns.forEach(handleIncomingReturn)
      calls.forEach(handleIncomingCall)
      proxyPropertyUpdates.forEach(handleIncomingProxyPropertyUpdate)
      stubPropertyUpdates.forEach(handleIncomingStubPropertyUpdate)
    }

    function sendMessage(message) {
      if(monitor)
        monitor.outgoingMessage(message)

      const {message: messageData, transferList} = Serializer.serialize(message)
      worker.postMessage(messageData, transferList)
    }

    worker.onmessage = ({data}) => {
      const message = Serializer.deserialize(data)
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

    return proxyPromise
  }

  return MessageRPC
})

/*
 todo
 ==============
 . try to implement properties using functions
 . proto-buf for proxy functions & properties instead of json
 . revoke / garbage collection for stubs
 . stress test and compare [proto | native | json] serializers
 . monitoring
 . properties - priorities

 */
