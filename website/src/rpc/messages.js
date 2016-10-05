'use strict'

define([
  'rpc/config'
], (
  {debug}
) => {

  const MessageTypes = {
    Init: 'init',
    Batch: 'batch',

    ApiCall: 'api-call',
    FunctionCall: 'function-call',
    Return: 'return',
    Error: 'error',
    StubPropertyUpdate: 'stub-prop-update',
    ProxyPropertyUpdate: 'proxy-prop-update',

    Value: 'value',
    Api: 'api',
    Function: 'function',
    SharedObject: 'shared-object'
  }

  const rpcMessage = (type, args) => {
    if(debug)
      return Object.assign({type}, {ts: Date.now()}, args)
    else
      return Object.assign({type}, args)
  }

  const init = api => ({type: MessageTypes.Init, api})
  const batch = rpcMessages => ({type: MessageTypes.Batch, rpcMessages})

  const rpcValue = value => ({type: MessageTypes.Value, value})
  const rpcApi = (stub, functionNames) => ({type: MessageTypes.Api, functionNames, stub})
  const rpcFunction = stub => ({type: MessageTypes.Function, stub})
  const rpcSharedObject = (stub, properties) => ({type: MessageTypes.SharedObject, properties, stub})

  const rpcApiCall = (id, stub, func, args, returnPriority) =>
    rpcMessage(MessageTypes.ApiCall, {id, stub, func, args, returnPriority})
  const rpcFunctionCall = (id, stub, args, returnPriority) => rpcMessage(MessageTypes.FunctionCall, {id, stub, args, returnPriority})
  const rpcReturn = (id, stub, value, callTimestamp) => debug
    ? rpcMessage(MessageTypes.Return, {id, stub, value, callTimestamp})
    : rpcMessage(MessageTypes.Return, {id, stub, value})

  const rpcError = (id, stub, error, callTimestamp) => debug
    ? rpcMessage(MessageTypes.Error, {id, stub, error, callTimestamp})
    : rpcMessage(MessageTypes.Error, {id, stub, error})

  const rpcStubPropertyUpdate = (stub, prop, value) => rpcMessage(MessageTypes.StubPropertyUpdate, {stub, prop, value})
  const rpcProxyPropertyUpdate = (stub, prop, value) => rpcMessage(MessageTypes.ProxyPropertyUpdate, {stub, prop, value})

  const isApiCall = rpcMessage => rpcMessage.type === MessageTypes.ApiCall
  const isFunctionCall = rpcMessage => rpcMessage.type === MessageTypes.FunctionCall
  const isReturn = rpcMessage => rpcMessage.type === MessageTypes.Return
  const isError = rpcMessage => rpcMessage.type === MessageTypes.Error
  const isProxyPropertyUpdate = rpcMessage => rpcMessage.type === MessageTypes.ProxyPropertyUpdate
  const isStubPropertyUpdate = rpcMessage => rpcMessage.type === MessageTypes.StubPropertyUpdate

  return {Types: MessageTypes, init, batch, rpcApiCall, rpcFunctionCall, rpcReturn, rpcError, rpcStubPropertyUpdate, rpcProxyPropertyUpdate,
    rpcValue, rpcApi, rpcFunction, rpcSharedObject,
    isApiCall, isFunctionCall, isReturn, isError, isProxyPropertyUpdate, isStubPropertyUpdate}
})