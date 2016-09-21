'use strict'

define([], () => {
  const MessageTypes = {
    Init: 'init',
    Batch: 'batch',
    Call: 'call',
    Return: 'return',
    Error: 'error',
    DataValue: 'data-value',
    ApiValue: 'api-value'

  }

  const init = (api) => ({type: MessageTypes.Init, api})
  const batch = rpcMessages => ({type: MessageTypes.Batch, rpcMessages})

  const rpcDataValue = data => ({type: MessageTypes.DataValue, data})
  const rpcApiValue = (api, stub) => ({type: MessageTypes.ApiValue, api, stub})
  const rpcCall = (id, stub, func, args, returnPriority) => ({type: MessageTypes.Call, id, stub, func, args, returnPriority})
  const rpcReturn = (id, stub, value) => ({type: MessageTypes.Return, id, stub, value})
  const rpcError = (id, stub, error) => ({type: MessageTypes.Error, id, stub, error})

  const serialize = json => JSON.stringify(json)
  const deserialize = str => JSON.parse(str)

  const isCall = rpcMessage => rpcMessage.type === MessageTypes.Call
  const isReturn = rpcMessage => rpcMessage.type === MessageTypes.Return
  const isError = rpcMessage => rpcMessage.type === MessageTypes.Error

  return {Types: MessageTypes, init, batch, rpcCall, rpcReturn, rpcError, rpcDataValue, rpcApiValue, serialize, deserialize, isCall, isReturn, isError}
})