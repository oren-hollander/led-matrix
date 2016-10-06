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
    ReleaseProxy: 'release-proxy',
    ReleaseStub: 'release-stub',

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
  const releaseProxy = ref => ({type: MessageTypes.ReleaseProxy, ref})
  const releaseStub = ref => ({type: MessageTypes.ReleaseStub, ref})

  const rpcValue = value => ({type: MessageTypes.Value, value})
  const rpcApi = (ref, functionNames) => ({type: MessageTypes.Api, functionNames, ref})
  const rpcFunction = ref => ({type: MessageTypes.Function, ref})
  const rpcSharedObject = (ref, properties) => ({type: MessageTypes.SharedObject, properties, ref})

  const rpcApiCall = (id, ref, func, args, returnPriority) =>
    rpcMessage(MessageTypes.ApiCall, {id, ref, func, args, returnPriority})
  const rpcFunctionCall = (id, ref, args, returnPriority) => rpcMessage(MessageTypes.FunctionCall, {id, ref, args, returnPriority})
  const rpcReturn = (id, ref, value, callTimestamp) => debug
    ? rpcMessage(MessageTypes.Return, {id, ref, value, callTimestamp})
    : rpcMessage(MessageTypes.Return, {id, ref, value})

  const rpcError = (id, ref, error, callTimestamp) => debug
    ? rpcMessage(MessageTypes.Error, {id, ref, error, callTimestamp})
    : rpcMessage(MessageTypes.Error, {id, ref, error})

  const rpcStubPropertyUpdate = (ref, prop, value) => rpcMessage(MessageTypes.StubPropertyUpdate, {ref, prop, value})
  const rpcProxyPropertyUpdate = (ref, prop, value) => rpcMessage(MessageTypes.ProxyPropertyUpdate, {ref, prop, value})

  const isApiCall = rpcMessage => rpcMessage.type === MessageTypes.ApiCall
  const isFunctionCall = rpcMessage => rpcMessage.type === MessageTypes.FunctionCall
  const isReturn = rpcMessage => rpcMessage.type === MessageTypes.Return
  const isError = rpcMessage => rpcMessage.type === MessageTypes.Error
  const isProxyPropertyUpdate = rpcMessage => rpcMessage.type === MessageTypes.ProxyPropertyUpdate
  const isStubPropertyUpdate = rpcMessage => rpcMessage.type === MessageTypes.StubPropertyUpdate

  return {Types: MessageTypes, init, batch, releaseProxy, releaseStub,
    rpcApiCall, rpcFunctionCall, rpcReturn, rpcError, rpcStubPropertyUpdate, rpcProxyPropertyUpdate,
    rpcValue, rpcApi, rpcFunction, rpcSharedObject,
    isApiCall, isFunctionCall, isReturn, isError, isProxyPropertyUpdate, isStubPropertyUpdate}
})